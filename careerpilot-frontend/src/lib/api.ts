/**
 * Thin fetch wrapper. The access token lives in memory only (not localStorage) to limit XSS exposure;
 * the refresh token is an httpOnly cookie managed by the backend.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: { path: string; message: string }[]) {
    super(message);
  }
}

export async function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!res.ok) return false;
      const data = await res.json();
      setAccessToken(data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: any = null;
  try { body = await res.json(); } catch {}
  const msg = Array.isArray(body?.message) ? body.message.join(", ") : body?.message ?? res.statusText;
  return new ApiError(res.status, msg || "Request failed", body?.errors);
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown; retry?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (res.status === 401 && init.retry !== false && !path.startsWith("/auth/")) {
    if (await refreshSession()) return api<T>(path, { ...init, retry: false });
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiUrl = (p: string) => `${BASE}${p}`;
