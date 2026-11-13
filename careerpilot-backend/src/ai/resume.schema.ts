import { z } from 'zod';

const str = z.string().trim().max(2000);
const optStr = str.nullish().transform((v) => v ?? null);

export const parsedResumeSchema = z.object({
  fullName: optStr,
  email: optStr,
  phone: optStr,
  location: optStr,
  summary: optStr,
  linkedinUrl: optStr,
  githubUrl: optStr,
  portfolioUrl: optStr,
  yearsOfExperience: z.number().min(0).max(60).nullish().transform((v) => v ?? null),
  skills: z.array(str.min(1)).max(100).default([]),
  education: z
    .array(
      z.object({
        institution: str.min(1),
        degree: str.min(1),
        field: optStr,
        startYear: z.number().int().nullish().transform((v) => v ?? null),
        endYear: z.number().int().nullish().transform((v) => v ?? null),
      }),
    )
    .max(20)
    .default([]),
  experiences: z
    .array(
      z.object({
        company: str.min(1),
        title: str.min(1),
        location: optStr,
        startDate: optStr,
        endDate: optStr,
        isCurrent: z.boolean().default(false),
        description: optStr,
        achievements: z.array(str).max(30).default([]),
      }),
    )
    .max(30)
    .default([]),
  projects: z
    .array(z.object({ name: str.min(1), description: optStr, url: optStr, technologies: z.array(str).max(30).default([]) }))
    .max(30)
    .default([]),
  certifications: z
    .array(z.object({ name: str.min(1), issuer: optStr, year: z.number().int().nullish().transform((v) => v ?? null) }))
    .max(30)
    .default([]),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;
