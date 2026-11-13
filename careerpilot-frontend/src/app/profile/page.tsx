"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileFormFields } from "@/components/profile/profile-form";
import { Alert, Button, Spinner } from "@/components/ui/primitives";
import { useProfile } from "@/hooks/use-data";
import { ApiError } from "@/lib/api";
import { formToPayload, mergeParsedIntoForm, profileFormSchema, profileToForm, type ProfileFormValues } from "@/schemas/profile";
import { profileService, resumeService } from "@/services";

export default function ProfilePage() {
  return <AppShell><Suspense fallback={<Spinner />}><ProfileEditor /></Suspense></AppShell>;
}

function ProfileEditor() {
  const qc = useQueryClient();
  const fromResume = useSearchParams().get("fromResume") ?? undefined;
  const profile = useProfile();
  const resume = useQuery({ queryKey: ["resume", fromResume], queryFn: () => resumeService.get(fromResume!), enabled: !!fromResume });
  const [banner, setBanner] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema) as never });

  useEffect(() => {
    if (!profile.data) return;
    if (fromResume && !resume.data) return;
    const base = profileToForm(profile.data);
    form.reset(fromResume && resume.data?.parsedData ? mergeParsedIntoForm(base, resume.data.parsedData) : base);
    // Intentionally depends on data identity only: don't clobber user edits on re-render.
  }, [profile.data, resume.data, fromResume]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: (v: ProfileFormValues) => profileService.update(formToPayload(v, fromResume)),
    onSuccess: () => {
      setBanner({ tone: "ok", text: "Profile saved." });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: (e) => setBanner({ tone: "danger", text: e instanceof ApiError ? `${e.message}${e.details ? ": " + e.details.map((d) => d.path).join(", ") : ""}` : "Could not save." }),
  });

  if (profile.isLoading || (fromResume && resume.isLoading)) return <Spinner />;
  if (profile.error) return <Alert>Could not load your profile.</Alert>;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-6" noValidate>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="text-sm text-muted">This verified profile is the single source of truth for resumes, answers and outreach.</p>
          </div>
          <Button type="submit" loading={save.isPending}>Save profile</Button>
        </div>
        {fromResume && resume.data?.parsedData && (
          <Alert tone="warn">AI-extracted data from “{resume.data.label}” has been loaded into the form below but is <strong>not saved yet</strong>. Check every field. AI can misread documents. Edit or delete anything wrong, then save.</Alert>
        )}
        {fromResume && resume.data && !resume.data.parsedData && <Alert tone="warn">This resume has not been parsed yet. Go back to Resumes and choose “Parse with AI”.</Alert>}
        {banner && <Alert tone={banner.tone}>{banner.text}</Alert>}
        {Object.keys(form.formState.errors).length > 0 && <Alert>Some fields need attention. See the highlighted messages below.</Alert>}
        <ProfileFormFields />
      </form>
    </FormProvider>
  );
}
