"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshSession, setAccessToken } from "@/lib/api";
import type { AuthUser } from "@/types";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (await refreshSession()) {
        try { setUser(await api<AuthUser>("/auth/me")); } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const apply = (d: { accessToken: string; user: AuthUser }) => { setAccessToken(d.accessToken); setUser(d.user); };
  const login = useCallback(async (email: string, password: string) => {
    apply(await api("/auth/login", { method: "POST", json: { email, password } }));
  }, []);
  const register = useCallback(async (email: string, password: string) => {
    apply(await api("/auth/register", { method: "POST", json: { email, password } }));
  }, []);
  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
};
