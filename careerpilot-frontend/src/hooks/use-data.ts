"use client";
import { useQuery } from "@tanstack/react-query";
import { healthService, profileService, resumeService } from "@/services";

export const useProfile = () => useQuery({ queryKey: ["profile"], queryFn: profileService.get });
export const useResumes = () => useQuery({ queryKey: ["resumes"], queryFn: resumeService.list });
export const useHealth = () => useQuery({ queryKey: ["health"], queryFn: healthService.get, refetchInterval: 30_000 });
