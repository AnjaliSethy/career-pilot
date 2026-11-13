"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Sparkles, Star, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, Badge, Button, Card, EmptyState, Spinner } from "@/components/ui/primitives";
import { useResumes } from "@/hooks/use-data";
import { ApiError } from "@/lib/api";
import { resumeService } from "@/services";

export default function ResumesPage() {
  return <AppShell><Resumes /></AppShell>;
}

const MAX_MB = 5;
const msg = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong");

function Resumes() {
  const qc = useQueryClient();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useResumes();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["resumes"] });

  const upload = useMutation({
    mutationFn: (f: File) => resumeService.upload(f),
    onSuccess: () => { setNotice({ tone: "ok", text: "Resume uploaded." }); refresh(); },
    onError: (e) => setNotice({ tone: "danger", text: msg(e) }),
  });
  const parse = useMutation({
    mutationFn: (id: string) => resumeService.parse(id),
    onSuccess: (_d, id) => { refresh(); router.push(`/profile?fromResume=${id}`); },
    onError: (e) => { setNotice({ tone: "danger", text: msg(e) }); refresh(); },
  });
  const makeDefault = useMutation({ mutationFn: resumeService.setDefault, onSuccess: refresh, onError: (e) => setNotice({ tone: "danger", text: msg(e) }) });
  const remove = useMutation({ mutationFn: resumeService.remove, onSuccess: refresh, onError: (e) => setNotice({ tone: "danger", text: msg(e) }) });

  const onPick = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) return setNotice({ tone: "danger", text: `File is larger than ${MAX_MB} MB.` });
    if (!/\.(pdf|docx)$/i.test(f.name)) return setNotice({ tone: "danger", text: "Only PDF and DOCX files are supported." });
    setNotice(null);
    upload.mutate(f);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Resumes</h1>
          <p className="text-sm text-muted">Upload PDF or DOCX files. Gemini extracts a structured profile that you review before anything is saved.</p>
        </div>
        <div>
          <input ref={input} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
          <Button onClick={() => input.current?.click()} loading={upload.isPending}><Upload className="h-4 w-4" /> Upload resume</Button>
        </div>
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      {isLoading && <Spinner />}
      {error && <Alert>Could not load resumes.</Alert>}
      {data?.length === 0 && (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No resumes yet" body="Upload your current resume to pre-fill your profile. Your files stay private to your account." />
      )}

      <div className="space-y-3">
        {data?.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center gap-4">
            <FileText className="h-5 w-5 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.label}</p>
              <p className="text-xs text-muted">{(r.sizeBytes / 1024).toFixed(0)} KB · uploaded {new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              {r.isDefault && <Badge tone="accent">Default</Badge>}
              {r.parseStatus === "PARSED" && <Badge tone={r.reviewedByUser ? "ok" : "warn"}>{r.reviewedByUser ? "Reviewed" : "Needs review"}</Badge>}
              {r.parseStatus === "FAILED" && <Badge tone="danger">Parse failed</Badge>}
            </div>
            <div className="flex gap-1">
              <Button variant="secondary" loading={parse.isPending && parse.variables === r.id} onClick={() => (r.parseStatus === "PARSED" ? router.push(`/profile?fromResume=${r.id}`) : parse.mutate(r.id))}>
                <Sparkles className="h-4 w-4" /> {r.parseStatus === "PARSED" ? "Review" : "Parse with AI"}
              </Button>
              {!r.isDefault && <Button variant="ghost" aria-label="Make default" title="Make default" onClick={() => makeDefault.mutate(r.id)}><Star className="h-4 w-4" /></Button>}
              <Button variant="ghost" aria-label="Download" title="Download" onClick={() => resumeService.download(r.id, r.originalName).catch((e) => setNotice({ tone: "danger", text: msg(e) }))}><Download className="h-4 w-4" /></Button>
              <Button variant="ghost" aria-label="Delete" title="Delete" onClick={() => { if (confirm(`Delete "${r.label}"? This cannot be undone.`)) remove.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {r.parseError && <p className="w-full text-xs text-danger">{r.parseError}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
