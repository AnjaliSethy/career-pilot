"use client";
import { redirect } from "next/navigation";
// Onboarding is the checklist on the dashboard (derived from real data), so this route just forwards.
export default function Onboarding() { redirect("/resumes"); }
