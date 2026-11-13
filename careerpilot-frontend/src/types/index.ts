export interface AuthUser { id: string; email: string; role: string }

export type WorkArrangement = "REMOTE" | "HYBRID" | "ONSITE";

export interface Profile {
  id: string;
  fullName: string | null;
  professionalEmail: string | null;
  phone: string | null;
  currentLocation: string | null;
  preferredLocations: string[];
  workArrangements: WorkArrangement[];
  currentTitle: string | null;
  currentCompany: string | null;
  yearsOfExperience: number | null;
  employmentStatus: string | null;
  noticePeriod: string | null;
  currentCompensation: string | null;
  expectedCompensation: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  careerObjective: string | null;
  summary: string | null;
  onboardingComplete: boolean;
  skills: { id: string; name: string; category: string | null }[];
  education: { id: string; institution: string; degree: string; field: string | null; startYear: number | null; endYear: number | null }[];
  experiences: { id: string; company: string; title: string; location: string | null; startDate: string | null; endDate: string | null; isCurrent: boolean; description: string | null; achievements: string[] }[];
  projects: { id: string; name: string; description: string | null; url: string | null; technologies: string[] }[];
  certifications: { id: string; name: string; issuer: string | null; year: number | null }[];
}

export interface ResumeSummary {
  id: string;
  label: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  isDefault: boolean;
  parseStatus: "PENDING" | "PARSED" | "FAILED";
  parseError: string | null;
  reviewedByUser: boolean;
  createdAt: string;
}

export interface ParsedResume {
  fullName: string | null; email: string | null; phone: string | null; location: string | null;
  summary: string | null; linkedinUrl: string | null; githubUrl: string | null; portfolioUrl: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  education: { institution: string; degree: string; field: string | null; startYear: number | null; endYear: number | null }[];
  experiences: { company: string; title: string; location: string | null; startDate: string | null; endDate: string | null; isCurrent: boolean; description: string | null; achievements: string[] }[];
  projects: { name: string; description: string | null; url: string | null; technologies: string[] }[];
  certifications: { name: string; issuer: string | null; year: number | null }[];
}

export interface Health {
  status: "ok" | "degraded";
  time: string;
  services: { database: "up" | "down"; gemini: "configured" | "not_configured" };
}
