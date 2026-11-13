import { BadRequestException } from '@nestjs/common';

export type ResumeKind = { mime: string; ext: 'pdf' | 'docx' };

/**
 * Validates by file signature (magic bytes), not by client-supplied MIME type or filename.
 * PDF starts with "%PDF-"; DOCX is a ZIP ("PK\x03\x04") containing word/document.xml.
 */
export function detectResumeKind(buf: Buffer, originalName: string): ResumeKind {
  const lower = originalName.toLowerCase();
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') {
    if (!lower.endsWith('.pdf')) throw new BadRequestException('File extension does not match PDF content');
    return { mime: 'application/pdf', ext: 'pdf' };
  }
  const isZip = buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  if (isZip && buf.includes(Buffer.from('word/document.xml'))) {
    if (!lower.endsWith('.docx')) throw new BadRequestException('File extension does not match DOCX content');
    return {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: 'docx',
    };
  }
  throw new BadRequestException('Only PDF and DOCX resumes are supported');
}
