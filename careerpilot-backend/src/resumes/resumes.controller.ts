import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { ResumesService } from './resumes.service';

@ApiTags('resumes')
@ApiBearerAuth()
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumes: ResumesService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.resumes.list(u.id);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, label: { type: 'string' } } } })
  @UseInterceptors(FileInterceptor('file'))
  upload(@CurrentUser() u: AuthUser, @UploadedFile() file: Express.Multer.File, @Body('label') label?: string) {
    return this.resumes.upload(u.id, file, label);
  }

  @Get(':id')
  async get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    const { extractedText, storageKey, sha256, ...rest } = await this.resumes.get(u.id, id);
    return { ...rest, extractedTextPreview: extractedText?.slice(0, 1500) ?? null };
  }

  @Get(':id/download')
  async download(@CurrentUser() u: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const f = await this.resumes.filePath(u.id, id);
    res.setHeader('Content-Type', f.mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.download(f.abs, f.name);
  }

  @Post(':id/parse')
  @HttpCode(200)
  parse(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.resumes.parse(u.id, id);
  }

  @Patch(':id/default')
  setDefault(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.resumes.setDefault(u.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.resumes.remove(u.id, id);
  }
}
