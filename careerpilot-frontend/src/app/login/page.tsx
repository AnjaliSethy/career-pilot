"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Alert, Button, Card, Field, Input } from "@/components/ui/primitives";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(10, "Use at least 10 characters"),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, loading, login, register: signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => { if (!loading && user) router.replace("/dashboard"); }, [loading, user, router]);

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      await (mode === "login" ? login(v.email, v.password) : signUp(v.email, v.password));
      router.replace(mode === "register" ? "/onboarding" : "/dashboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server. Is the backend running?");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="text-xl font-semibold">CareerPilot AI</h1>
          <p className="text-sm text-muted">{mode === "login" ? "Sign in to your workspace" : "Create your owner account"}</p>
        </div>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
          <Field label="Password" error={errors.password?.message}>
            <Input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">{mode === "login" ? "Sign in" : "Create account"}</Button>
        </form>
        <button className="text-sm text-muted hover:text-fg" onClick={() => { setError(null); setMode(mode === "login" ? "register" : "login"); }}>
          {mode === "login" ? "First time? Create the owner account" : "Already have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}
