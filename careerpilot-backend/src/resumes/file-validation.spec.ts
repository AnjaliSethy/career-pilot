import { BadRequestException } from '@nestjs/common';
import { detectResumeKind } from './file-validation';

describe('detectResumeKind', () => {
  it('accepts a PDF by signature', () => {
    expect(detectResumeKind(Buffer.from('%PDF-1.7 rest'), 'cv.pdf').ext).toBe('pdf');
  });
  it('accepts a DOCX (zip containing word/document.xml)', () => {
    const buf = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('....word/document.xml....')]);
    expect(detectResumeKind(buf, 'cv.docx').ext).toBe('docx');
  });
  it('rejects an executable renamed to .pdf', () => {
    expect(() => detectResumeKind(Buffer.from('MZ\x90\x00 fake exe'), 'cv.pdf')).toThrow(BadRequestException);
  });
  it('rejects a generic zip renamed to .docx', () => {
    const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('other/file.txt')]);
    expect(() => detectResumeKind(zip, 'cv.docx')).toThrow(BadRequestException);
  });
  it('rejects extension/content mismatch', () => {
    expect(() => detectResumeKind(Buffer.from('%PDF-1.4'), 'cv.docx')).toThrow(BadRequestException);
  });
});
