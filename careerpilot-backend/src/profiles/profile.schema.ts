import { z } from 'zod';

const nullableStr = (max = 500) => z.string().trim().max(max).nullish();
const url = z.string().trim().url().max(500).nullish().or(z.literal(''));

export const updateProfileSchema = z.object({
  fullName: nullableStr(200),
  professionalEmail: z.string().trim().email().nullish().or(z.literal('')),
  phone: nullableStr(40),
  currentLocation: nullableStr(200),
  preferredLocations: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  workArrangements: z.array(z.enum(['REMOTE', 'HYBRID', 'ONSITE'])).max(3).optional(),
  currentTitle: nullableStr(200),
  currentCompany: nullableStr(200),
  yearsOfExperience: z.number().min(0).max(60).nullish(),
  employmentStatus: nullableStr(100),
  noticePeriod: nullableStr(100),
  currentCompensation: nullableStr(100),
  expectedCompensation: nullableStr(100),
  portfolioUrl: url,
  githubUrl: url,
  linkedinUrl: url,
  careerObjective: nullableStr(2000),
  summary: nullableStr(4000),
  onboardingComplete: z.boolean().optional(),
  /** If set, marks that resume's extracted data as reviewed by the user. */
  sourceResumeId: z.string().optional(),
  skills: z.array(z.object({ name: z.string().trim().min(1).max(100), category: nullableStr(100) })).max(150).optional(),
  education: z
    .array(
      z.object({
        institution: z.string().trim().min(1).max(200),
        degree: z.string().trim().min(1).max(200),
        field: nullableStr(200),
        startYear: z.number().int().min(1950).max(2100).nullish(),
        endYear: z.number().int().min(1950).max(2100).nullish(),
      }),
    )
    .max(20)
    .optional(),
  experiences: z
    .array(
      z.object({
        company: z.string().trim().min(1).max(200),
        title: z.string().trim().min(1).max(200),
        location: nullableStr(200),
        startDate: nullableStr(50),
        endDate: nullableStr(50),
        isCurrent: z.boolean().default(false),
        description: nullableStr(4000),
        achievements: z.array(z.string().trim().max(1000)).max(30).default([]),
      }),
    )
    .max(30)
    .optional(),
  projects: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: nullableStr(3000),
        url,
        technologies: z.array(z.string().trim().max(100)).max(30).default([]),
      }),
    )
    .max(30)
    .optional(),
  certifications: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        issuer: nullableStr(200),
        year: z.number().int().min(1950).max(2100).nullish(),
      }),
    )
    .max(30)
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
