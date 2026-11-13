"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui/primitives";
import type { ProfileFormValues } from "@/schemas/profile";

const arrangements = [["REMOTE", "Remote"], ["HYBRID", "Hybrid"], ["ONSITE", "On-site"]] as const;

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-medium">{title}</h2>{action}</div>
      {children}
    </Card>
  );
}

export function ProfileFormFields() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ProfileFormValues>();
  const edu = useFieldArray({ name: "education" });
  const exp = useFieldArray({ name: "experiences" });
  const prj = useFieldArray({ name: "projects" });
  const cert = useFieldArray({ name: "certifications" });
  const selected = watch("workArrangements");

  return (
    <div className="space-y-6">
      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.fullName?.message}><Input {...register("fullName")} /></Field>
          <Field label="Professional email" error={errors.professionalEmail?.message}><Input type="email" {...register("professionalEmail")} /></Field>
          <Field label="Phone (optional)"><Input {...register("phone")} /></Field>
          <Field label="Current location"><Input {...register("currentLocation")} /></Field>
          <Field label="Current job title"><Input {...register("currentTitle")} /></Field>
          <Field label="Current company"><Input {...register("currentCompany")} /></Field>
          <Field label="Years of experience" error={errors.yearsOfExperience?.message}><Input type="number" step="0.5" {...register("yearsOfExperience")} /></Field>
          <Field label="Employment status"><Input placeholder="Employed, Open to work…" {...register("employmentStatus")} /></Field>
          <Field label="Notice period"><Input {...register("noticePeriod")} /></Field>
        </div>
        <Field label="Summary"><Textarea {...register("summary")} /></Field>
        <Field label="Career objective"><Textarea {...register("careerObjective")} /></Field>
      </Section>

      <Section title="Preferences">
        <Field label="Preferred locations" hint="Comma separated"><Input {...register("preferredLocations")} /></Field>
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Work arrangement</p>
          <div className="flex gap-4">
            {arrangements.map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selected.includes(v)} onChange={(e) => setValue("workArrangements", e.target.checked ? [...selected, v] : selected.filter((x) => x !== v), { shouldDirty: true })} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current compensation (optional)" hint="Never shared automatically"><Input {...register("currentCompensation")} /></Field>
          <Field label="Expected compensation (optional)" hint="Never shared automatically"><Input {...register("expectedCompensation")} /></Field>
        </div>
      </Section>

      <Section title="Links">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Portfolio" error={errors.portfolioUrl?.message}><Input {...register("portfolioUrl")} /></Field>
          <Field label="GitHub" error={errors.githubUrl?.message}><Input {...register("githubUrl")} /></Field>
          <Field label="LinkedIn" error={errors.linkedinUrl?.message}><Input {...register("linkedinUrl")} /></Field>
        </div>
      </Section>

      <Section title="Skills"><Field label="Skills" hint="Comma separated. Only list skills you actually have."><Textarea {...register("skills")} /></Field></Section>

      <Section title="Experience" action={<Button type="button" variant="secondary" onClick={() => exp.append({ company: "", title: "", isCurrent: false, achievements: "" })}><Plus className="h-4 w-4" /> Add</Button>}>
        {exp.fields.length === 0 && <p className="text-sm text-muted">No experience added.</p>}
        {exp.fields.map((f, i) => (
          <div key={f.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company" error={errors.experiences?.[i]?.company?.message}><Input {...register(`experiences.${i}.company`)} /></Field>
              <Field label="Title" error={errors.experiences?.[i]?.title?.message}><Input {...register(`experiences.${i}.title`)} /></Field>
              <Field label="Start"><Input placeholder="Jan 2022" {...register(`experiences.${i}.startDate`)} /></Field>
              <Field label="End"><Input placeholder="Present" {...register(`experiences.${i}.endDate`)} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register(`experiences.${i}.isCurrent`)} /> Current role</label>
            <Field label="Description"><Textarea {...register(`experiences.${i}.description`)} /></Field>
            <Field label="Achievements" hint="One per line. Do not add metrics you can't back up."><Textarea {...register(`experiences.${i}.achievements`)} /></Field>
            <Button type="button" variant="ghost" onClick={() => exp.remove(i)}><Trash2 className="h-4 w-4" /> Remove</Button>
          </div>
        ))}
      </Section>

      <Section title="Education" action={<Button type="button" variant="secondary" onClick={() => edu.append({ institution: "", degree: "" })}><Plus className="h-4 w-4" /> Add</Button>}>
        {edu.fields.length === 0 && <p className="text-sm text-muted">No education added.</p>}
        {edu.fields.map((f, i) => (
          <div key={f.id} className="grid items-end gap-3 sm:grid-cols-6">
            <div className="sm:col-span-2"><Field label="Institution" error={errors.education?.[i]?.institution?.message}><Input {...register(`education.${i}.institution`)} /></Field></div>
            <div className="sm:col-span-2"><Field label="Degree" error={errors.education?.[i]?.degree?.message}><Input {...register(`education.${i}.degree`)} /></Field></div>
            <Field label="From"><Input type="number" {...register(`education.${i}.startYear`)} /></Field>
            <div className="flex items-end gap-2"><Field label="To"><Input type="number" {...register(`education.${i}.endYear`)} /></Field><Button type="button" variant="ghost" aria-label="Remove" onClick={() => edu.remove(i)}><Trash2 className="h-4 w-4" /></Button></div>
          </div>
        ))}
      </Section>

      <Section title="Projects" action={<Button type="button" variant="secondary" onClick={() => prj.append({ name: "" })}><Plus className="h-4 w-4" /> Add</Button>}>
        {prj.fields.length === 0 && <p className="text-sm text-muted">No projects added.</p>}
        {prj.fields.map((f, i) => (
          <div key={f.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" error={errors.projects?.[i]?.name?.message}><Input {...register(`projects.${i}.name`)} /></Field>
              <Field label="URL" error={errors.projects?.[i]?.url?.message}><Input {...register(`projects.${i}.url`)} /></Field>
            </div>
            <Field label="Description"><Textarea {...register(`projects.${i}.description`)} /></Field>
            <Field label="Technologies" hint="Comma separated"><Input {...register(`projects.${i}.technologies`)} /></Field>
            <Button type="button" variant="ghost" onClick={() => prj.remove(i)}><Trash2 className="h-4 w-4" /> Remove</Button>
          </div>
        ))}
      </Section>

      <Section title="Certifications" action={<Button type="button" variant="secondary" onClick={() => cert.append({ name: "" })}><Plus className="h-4 w-4" /> Add</Button>}>
        {cert.fields.length === 0 && <p className="text-sm text-muted">No certifications added.</p>}
        {cert.fields.map((f, i) => (
          <div key={f.id} className="grid items-end gap-3 sm:grid-cols-6">
            <div className="sm:col-span-3"><Field label="Name" error={errors.certifications?.[i]?.name?.message}><Input {...register(`certifications.${i}.name`)} /></Field></div>
            <div className="sm:col-span-2"><Field label="Issuer"><Input {...register(`certifications.${i}.issuer`)} /></Field></div>
            <div className="flex items-end gap-2"><Field label="Year"><Input type="number" {...register(`certifications.${i}.year`)} /></Field><Button type="button" variant="ghost" aria-label="Remove" onClick={() => cert.remove(i)}><Trash2 className="h-4 w-4" /></Button></div>
          </div>
        ))}
      </Section>
    </div>
  );
}
