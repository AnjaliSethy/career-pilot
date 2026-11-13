"use client";
import Link from "next/link";
import { CheckCircle2, Circle, FileText, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, Badge, Card, Spinner } from "@/components/ui/primitives";
import { useHealth, useProfile, useResumes } from "@/hooks/use-data";

export default function DashboardPage() {
  return <AppShell><Dashboard /></AppShell>;
}

function Dashboard() {
  const profile = useProfile();
  const resumes = useResumes();
  const health = useHealth();

  if (profile.isLoading || resumes.isLoading) return <Spinner />;
  if (profile.error || resumes.error) return <Alert>Could not load your data. Check that the backend is running and reachable.</Alert>;

  const p = profile.data!;
  const list = resumes.data!;
  const basicsDone = Boolean(p.fullName && p.currentTitle && p.skills.length);
  const steps = [
    { done: list.length > 0, label: "Upload a resume", href: "/resumes" },
    { done: list.some((r) => r.reviewedByUser), label: "Parse it with AI and review the extracted data", href: "/resumes" },
    { done: basicsDone, label: "Complete your profile basics (name, title, skills)", href: "/profile" },
  ];
  const complete = steps.every((s) => s.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome{p.fullName ? `, ${p.fullName.split(" ")[0]}` : ""}</h1>
        <p className="text-sm text-muted">Phase 1 foundation: your profile, resumes and system status. Job discovery arrives in Phase 2.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-xs text-muted">Resumes</p><p className="mt-1 text-3xl font-semibold">{list.length}</p></Card>
        <Card><p className="text-xs text-muted">Skills in profile</p><p className="mt-1 text-3xl font-semibold">{p.skills.length}</p></Card>
        <Card><p className="text-xs text-muted">Experience entries</p><p className="mt-1 text-3xl font-semibold">{p.experiences.length}</p></Card>
      </div>

      {!complete && (
        <Card className="space-y-3">
          <h2 className="font-medium">Finish setting up</h2>
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm">
                {s.done ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <Circle className="h-4 w-4 text-muted" />}
                <Link href={s.href} className={s.done ? "text-muted line-through" : "hover:text-accent"}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> System health</h2>
        {health.isLoading && <Spinner />}
        {health.error && <Alert>Backend unreachable.</Alert>}
        {health.data && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-2">Database <Badge tone={health.data.services.database === "up" ? "ok" : "danger"}>{health.data.services.database}</Badge></span>
            <span className="flex items-center gap-2">Gemini <Badge tone={health.data.services.gemini === "configured" ? "ok" : "warn"}>{health.data.services.gemini === "configured" ? "key configured" : "not configured"}</Badge></span>
          </div>
        )}
        <p className="text-xs text-muted">“Configured” means a key is present. Live verification of external APIs is added with the Integrations page.</p>
      </Card>

      {list.length === 0 && (
        <Card className="flex items-center gap-3 text-sm text-muted"><FileText className="h-4 w-4" /> No resumes yet. <Link className="text-accent" href="/resumes">Upload one</Link></Card>
      )}
    </div>
  );
}
