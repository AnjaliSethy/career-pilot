"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Activity, BarChart3, Bell, Briefcase, CheckSquare, Cog, FileText, LayoutDashboard, Linkedin, LogOut, Mail, Search, UserRound, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/primitives";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { label: "Find Jobs", icon: Search, phase: 2 },
  { label: "Applications", icon: Briefcase, phase: 4 },
  { label: "Recruiters", icon: Users, phase: 5 },
  { label: "Outreach", icon: Mail, phase: 5 },
  { label: "LinkedIn Studio", icon: Linkedin, phase: 6 },
  { label: "Approval Center", icon: CheckSquare, phase: 4 },
  { label: "Automation", icon: Activity, phase: 7 },
  { label: "Analytics", icon: BarChart3, phase: 7 },
  { label: "Settings", icon: Cog, phase: 7 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  if (loading || !user) return <div className="grid min-h-screen place-items-center"><Spinner label="Loading your workspace" /></div>;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-[#0a1020]">C</span> CareerPilot
        </div>
        <nav className="flex-1 space-y-1" aria-label="Main">
          {nav.map((item) => {
            const Icon = item.icon;
            if (!("href" in item)) {
              return (
                <div key={item.label} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted/50" aria-disabled>
                  <Icon className="h-4 w-4" /> {item.label}
                  <span className="ml-auto rounded bg-surface-2 px-1.5 text-[10px]">Phase {item.phase}</span>
                </div>
              );
            }
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition", active ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="text-sm text-muted md:hidden font-semibold text-fg">CareerPilot</div>
          <div className="ml-auto flex items-center gap-4">
            <button className="text-muted" aria-label="Notifications (coming in Phase 7)" disabled><Bell className="h-5 w-5" /></button>
            <span className="text-sm text-muted">{user.email}</span>
            <button onClick={async () => { await logout(); router.replace("/login"); }} className="text-muted hover:text-fg" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden" aria-label="Mobile">
          {nav.filter((n) => "href" in n).map((n) => "href" in n && <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1 text-sm text-muted hover:text-fg">{n.label}</Link>)}
        </nav>
        <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
