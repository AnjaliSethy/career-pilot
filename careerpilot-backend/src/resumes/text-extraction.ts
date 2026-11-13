import * as mammoth from 'mammoth';

// pdf-parse's index.js runs a debug routine when imported directly; import the lib file instead.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (b: Buffer) => Promise<{ text: string }> = require('pdf-parse/lib/pdf-parse.js');

export async function extractText(buf: Buffer, ext: 'pdf' | 'docx'): Promise<string> {
  const raw = ext === 'pdf' ? (await pdfParse(buf)).text : (await mammoth.extractRawText({ buffer: buf })).value;
  return raw.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
