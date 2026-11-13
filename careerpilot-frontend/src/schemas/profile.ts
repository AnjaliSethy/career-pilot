import { z } from "zod";
import type { Profile, ParsedResume } from "@/types";

const optStr = z.string().trim().max(2000).optional().or(z.literal(""));
const optUrl = z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal(""));
const optYear = z.preprocess((v) => (v === "" || v == null || Number.isNaN(v) ? undefined : Number(v)), z.number().int().min(1950).max(2100).optional());

export const profileFormSchema = z.object({
  fullName: optStr,
  professionalEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: optStr,
  currentLocation: optStr,
  preferredLocations: z.string().optional(), // comma separated in the form
  workArrangements: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])),
  currentTitle: optStr,
  currentCompany: optStr,
  yearsOfExperience: z.preprocess((v) => (v === "" || v == null || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).max(60).optional()),
  employmentStatus: optStr,
  noticePeriod: optStr,
  currentCompensation: optStr,
  expectedCompensation: optStr,
  portfolioUrl: optUrl,
  githubUrl: optUrl,
  linkedinUrl: optUrl,
  careerObjective: optStr,
  summary: optStr,
  skills: z.string().optional(), // comma separated
  education: z.array(z.object({ institution: z.string().trim().min(1, "Required"), degree: z.string().trim().min(1, "Required"), field: optStr, startYear: optYear, endYear: optYear })),
  experiences: z.array(z.object({
    company: z.string().trim().min(1, "Required"), title: z.string().trim().min(1, "Required"),
    location: optStr, startDate: optStr, endDate: optStr, isCurrent: z.boolean(), description: optStr,
    achievements: z.string().optional(), // one per line
  })),
  projects: z.array(z.object({ name: z.string().trim().min(1, "Required"), description: optStr, url: optUrl, technologies: z.string().optional() })),
  certifications: z.array(z.object({ name: z.string().trim().min(1, "Required"), issuer: optStr, year: optYear })),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type ProfilePayload = Record<string, unknown>;

const csv = (s?: string) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const lines = (s?: string) => (s ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
const nn = <T,>(v: T | undefined | "") => (v === "" || v === undefined ? null : v);

export function profileToForm(p: Profile): ProfileFormValues {
  return {
    fullName: p.fullName ?? "", professionalEmail: p.professionalEmail ?? "", phone: p.phone ?? "",
    currentLocation: p.currentLocation ?? "", preferredLocations: p.preferredLocations.join(", "),
    workArrangements: p.workArrangements, currentTitle: p.currentTitle ?? "", currentCompany: p.currentCompany ?? "",
    yearsOfExperience: p.yearsOfExperience ?? undefined, employmentStatus: p.employmentStatus ?? "",
    noticePeriod: p.noticePeriod ?? "", currentCompensation: p.currentCompensation ?? "", expectedCompensation: p.expectedCompensation ?? "",
    portfolioUrl: p.portfolioUrl ?? "", githubUrl: p.githubUrl ?? "", linkedinUrl: p.linkedinUrl ?? "",
    careerObjective: p.careerObjective ?? "", summary: p.summary ?? "",
    skills: p.skills.map((s) => s.name).join(", "),
    education: p.education.map((e) => ({ institution: e.institution, degree: e.degree, field: e.field ?? "", startYear: e.startYear ?? undefined, endYear: e.endYear ?? undefined })),
    experiences: p.experiences.map((e) => ({ company: e.company, title: e.title, location: e.location ?? "", startDate: e.startDate ?? "", endDate: e.endDate ?? "", isCurrent: e.isCurrent, description: e.description ?? "", achievements: e.achievements.join("\n") })),
    projects: p.projects.map((x) => ({ name: x.name, description: x.description ?? "", url: x.url ?? "", technologies: x.technologies.join(", ") })),
    certifications: p.certifications.map((c) => ({ name: c.name, issuer: c.issuer ?? "", year: c.year ?? undefined })),
  };
}

/** Overlays AI-extracted resume data onto the current form. Only non-empty extracted values replace existing ones. */
export function mergeParsedIntoForm(base: ProfileFormValues, r: ParsedResume): ProfileFormValues {
  const pick = (cur: string | undefined, next: string | null) => (next ? next : cur ?? "");
  return {
    ...base,
    fullName: pick(base.fullName, r.fullName),
    professionalEmail: pick(base.professionalEmail, r.email),
    phone: pick(base.phone, r.phone),
    currentLocation: pick(base.currentLocation, r.location),
    summary: pick(base.summary, r.summary),
    linkedinUrl: pick(base.linkedinUrl, r.linkedinUrl),
    githubUrl: pick(base.githubUrl, r.githubUrl),
    portfolioUrl: pick(base.portfolioUrl, r.portfolioUrl),
    yearsOfExperience: r.yearsOfExperience ?? base.yearsOfExperience,
    skills: r.skills.length ? r.skills.join(", ") : base.skills,
    education: r.education.length ? r.education.map((e) => ({ institution: e.institution, degree: e.degree, field: e.field ?? "", startYear: e.startYear ?? undefined, endYear: e.endYear ?? undefined })) : base.education,
    experiences: r.experiences.length ? r.experiences.map((e) => ({ company: e.company, title: e.title, location: e.location ?? "", startDate: e.startDate ?? "", endDate: e.endDate ?? "", isCurrent: e.isCurrent, description: e.description ?? "", achievements: e.achievements.join("\n") })) : base.experiences,
    projects: r.projects.length ? r.projects.map((x) => ({ name: x.name, description: x.description ?? "", url: x.url ?? "", technologies: x.technologies.join(", ") })) : base.projects,
    certifications: r.certifications.length ? r.certifications.map((c) => ({ name: c.name, issuer: c.issuer ?? "", year: c.year ?? undefined })) : base.certifications,
  };
}

export function formToPayload(v: ProfileFormValues, sourceResumeId?: string): ProfilePayload {
  return {
    fullName: nn(v.fullName), professionalEmail: v.professionalEmail ?? "", phone: nn(v.phone),
    currentLocation: nn(v.currentLocation), preferredLocations: csv(v.preferredLocations),
    workArrangements: v.workArrangements, currentTitle: nn(v.currentTitle), currentCompany: nn(v.currentCompany),
    yearsOfExperience: v.yearsOfExperience ?? null, employmentStatus: nn(v.employmentStatus), noticePeriod: nn(v.noticePeriod),
    currentCompensation: nn(v.currentCompensation), expectedCompensation: nn(v.expectedCompensation),
    portfolioUrl: v.portfolioUrl ?? "", githubUrl: v.githubUrl ?? "", linkedinUrl: v.linkedinUrl ?? "",
    careerObjective: nn(v.careerObjective), summary: nn(v.summary),
    skills: csv(v.skills).map((name) => ({ name })),
    education: v.education.map((e) => ({ institution: e.institution, degree: e.degree, field: nn(e.field), startYear: e.startYear ?? null, endYear: e.endYear ?? null })),
    experiences: v.experiences.map((e) => ({ company: e.company, title: e.title, location: nn(e.location), startDate: nn(e.startDate), endDate: nn(e.endDate), isCurrent: e.isCurrent, description: nn(e.description), achievements: lines(e.achievements) })),
    projects: v.projects.map((x) => ({ name: x.name, description: nn(x.description), url: x.url ?? "", technologies: csv(x.technologies) })),
    certifications: v.certifications.map((c) => ({ name: c.name, issuer: nn(c.issuer), year: c.year ?? null })),
    ...(sourceResumeId ? { sourceResumeId } : {}),
  };
}
