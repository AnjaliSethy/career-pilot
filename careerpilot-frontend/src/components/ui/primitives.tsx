"use client";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { className, variant = "primary", loading, disabled, children, ...rest }, ref,
) {
  const styles = {
    primary: "bg-accent text-[#0a1020] hover:brightness-110",
    secondary: "bg-surface-2 text-fg border border-border hover:border-accent/60",
    ghost: "text-muted hover:text-fg hover:bg-surface-2",
    danger: "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25",
  }[variant];
  return (
    <button ref={ref} disabled={disabled || loading}
      className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed", styles, className)} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

const field = "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-accent outline-none";
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(field, "min-h-[88px]", className)} {...p} />;
});

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted/70">{hint}</span>}
      {error && <span role="alert" className="block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur", className)} {...p} />;
}

export function Badge({ tone = "muted", children }: { tone?: "ok" | "warn" | "danger" | "muted" | "accent"; children: React.ReactNode }) {
  const t = { ok: "bg-ok/15 text-ok", warn: "bg-warn/15 text-warn", danger: "bg-danger/15 text-danger", muted: "bg-surface-2 text-muted", accent: "bg-accent/15 text-accent" }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", t)}>{children}</span>;
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "ok" | "warn"; children: React.ReactNode }) {
  const t = { danger: "border-danger/40 bg-danger/10 text-danger", ok: "border-ok/40 bg-ok/10 text-ok", warn: "border-warn/40 bg-warn/10 text-warn" }[tone];
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", t)}>{children}</div>;
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <div className="flex items-center gap-2 text-sm text-muted" role="status"><Loader2 className="h-4 w-4 animate-spin" />{label}…</div>;
}
