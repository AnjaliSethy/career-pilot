import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ResumeParserService } from '../ai/resume-parser.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { detectResumeKind } from './file-validation';
import { MalwareScanner } from './malware-scanner';
import { extractText } from './text-extraction';

const listSelect = {
  id: true, label: true, originalName: true, mimeType: true, sizeBytes: true, isDefault: true,
  parseStatus: true, parseError: true, reviewedByUser: true, createdAt: true, updatedAt: true,
};

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);
  private readonly root: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly scanner: MalwareScanner,
    private readonly parser: ResumeParserService,
    private readonly audit: AuditService,
  ) {
    this.root = path.resolve(this.config.get<string>('UPLOAD_DIR') ?? './uploads');
  }

  list(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId, deletedAt: null },
      select: listSelect,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id, userId, deletedAt: null } });
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }

  async upload(userId: string, file: Express.Multer.File | undefined, label?: string) {
    if (!file) throw new BadRequestException('No file uploaded (field name must be "file")');
    const kind = detectResumeKind(file.buffer, file.originalname);
    await this.scanner.scan(file.buffer, file.originalname);

    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const dup = await this.prisma.resume.findFirst({ where: { userId, sha256, deletedAt: null } });
    if (dup) throw new ConflictException('This resume has already been uploaded');

    let text: string;
    try {
      text = await extractText(file.buffer, kind.ext);
    } catch {
      throw new BadRequestException('Could not read this file. It may be corrupted or password protected.');
    }
    if (text.length < 50) {
      throw new BadRequestException('No readable text found. Scanned/image-only PDFs are not supported yet.');
    }

    // Server-generated key: user-supplied filenames never touch the filesystem path.
    const storageKey = `${userId}/${randomUUID()}.${kind.ext}`;
    const abs = this.resolveKey(storageKey);
    await fs.mkdir(path.dirname(abs), { recursive: true, mode: 0o700 });
    await fs.writeFile(abs, file.buffer, { mode: 0o600 });

    const hasDefault = (await this.prisma.resume.count({ where: { userId, isDefault: true, deletedAt: null } })) > 0;
    const safeName = path.basename(file.originalname).slice(0, 200);
    const resume = await this.prisma.resume.create({
      data: {
        userId,
        label: (label?.trim() || safeName).slice(0, 120),
        originalName: safeName,
        storageKey,
        mimeType: kind.mime,
        sizeBytes: file.size,
        sha256,
        isDefault: !hasDefault,
        extractedText: text,
      },
      select: listSelect,
    });
    await this.audit.log(userId, 'resume.upload', 'Resume', resume.id, { sizeBytes: file.size, type: kind.ext });
    return resume;
  }

  /** Runs Gemini extraction; result is stored for the user to review, never applied automatically. */
  async parse(userId: string, id: string) {
    const resume = await this.get(userId, id);
    if (!resume.extractedText) throw new BadRequestException('Resume has no extracted text');
    try {
      const parsed = await this.parser.parse(userId, resume.extractedText);
      await this.prisma.resume.update({
        where: { id },
        data: { parsedData: parsed as object, parseStatus: 'PARSED', parseError: null, reviewedByUser: false },
      });
      await this.audit.log(userId, 'resume.parse', 'Resume', id);
      return parsed;
    } catch (e) {
      await this.prisma.resume.update({
        where: { id },
        data: { parseStatus: 'FAILED', parseError: (e as Error).message.slice(0, 300) },
      });
      throw e;
    }
  }

  async setDefault(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.$transaction([
      this.prisma.resume.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
      this.prisma.resume.update({ where: { id }, data: { isDefault: true } }),
    ]);
    await this.audit.log(userId, 'resume.set_default', 'Resume', id);
    return this.list(userId);
  }

  async remove(userId: string, id: string) {
    const resume = await this.get(userId, id);
    await this.prisma.resume.update({ where: { id }, data: { deletedAt: new Date(), isDefault: false } });
    await fs.unlink(this.resolveKey(resume.storageKey)).catch((e) => this.logger.warn(`unlink failed: ${e.message}`));
    if (resume.isDefault) {
      const next = await this.prisma.resume.findFirst({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
      if (next) await this.prisma.resume.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    await this.audit.log(userId, 'resume.delete', 'Resume', id);
  }

  async filePath(userId: string, id: string) {
    const resume = await this.get(userId, id);
    return { abs: this.resolveKey(resume.storageKey), name: resume.originalName, mime: resume.mimeType };
  }

  private resolveKey(key: string) {
    const abs = path.resolve(this.root, key);
    if (!abs.startsWith(this.root + path.sep)) throw new BadRequestException('Invalid storage key');
    return abs;
  }
}
