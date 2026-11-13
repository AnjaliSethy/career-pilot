import { api, apiUrl, getAccessToken } from "@/lib/api";
import type { Health, ParsedResume, Profile, ResumeSummary } from "@/types";
import type { ProfilePayload } from "@/schemas/profile";

export const healthService = { get: () => api<Health>("/health") };

export const profileService = {
  get: () => api<Profile>("/profile"),
  update: (body: ProfilePayload) => api<Profile>("/profile", { method: "PUT", json: body }),
};

export const resumeService = {
  list: () => api<ResumeSummary[]>("/resumes"),
  get: (id: string) => api<ResumeSummary & { parsedData: ParsedResume | null; extractedTextPreview: string | null }>(`/resumes/${id}`),
  upload: (file: File, label?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (label) fd.append("label", label);
    return api<ResumeSummary>("/resumes/upload", { method: "POST", body: fd });
  },
  parse: (id: string) => api<ParsedResume>(`/resumes/${id}/parse`, { method: "POST" }),
  setDefault: (id: string) => api<ResumeSummary[]>(`/resumes/${id}/default`, { method: "PATCH" }),
  remove: (id: string) => api<void>(`/resumes/${id}`, { method: "DELETE" }),
  /** Authenticated download: fetch with the bearer token, then hand the blob to the browser. */
  async download(id: string, name: string) {
    const res = await fetch(apiUrl(`/resumes/${id}/download`), {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Download failed");
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
  },
};
