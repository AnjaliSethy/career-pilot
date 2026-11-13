import { parsedResumeSchema } from './resume.schema';

describe('parsedResumeSchema (AI output validation)', () => {
  it('normalizes missing fields to null / empty arrays', () => {
    const out = parsedResumeSchema.parse({ fullName: 'Test User' });
    expect(out.email).toBeNull();
    expect(out.skills).toEqual([]);
  });
  it('rejects malformed experience entries', () => {
    expect(parsedResumeSchema.safeParse({ experiences: [{ company: '', title: 'x' }] }).success).toBe(false);
  });
  it('rejects wrong types from the model', () => {
    expect(parsedResumeSchema.safeParse({ skills: 'React' }).success).toBe(false);
  });
});
