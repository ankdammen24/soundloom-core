// Single source of truth for media-catalog authentication.
//
// - Access token lives in memory.
// - Refresh token is expected in an httpOnly cookie set by the backend on /auth/login.
//   As a fallback (e.g. when backend returns refresh_token in the JSON body), we
//   persist it under MC_REFRESH_KEY in localStorage.
// - All other auth chains (Supabase, Clerk, Lovable, OAuth) are intentionally removed.

import { useSyncExternalStore } from "react";

const env = import.meta.env as Record<string, string | undefined>;
const API_BASE_URL = (env.VITE_API_BASE_URL ?? "https://api.mediarosenqvist.com").replace(
  /\/+$/,
  "",
);

const MC_REFRESH_KEY = "mc.refresh_token";

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  displayName?: string;
  roles?: string[];
  [key: string]: unknown;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type State = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  /** Epoch ms when the current access token expires (best-effort). */
  expiresAt: number | null;
};

let state: State = {
  status: "loading",
  user: null,
  accessToken: null,
  expiresAt: null,
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export const authStore = {
  getState: () => state,
  getAccessToken: () => state.accessToken,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setLoading: () => {
    state = { ...state, status: "loading" };
    emit();
  },
  setAuthenticated: (user: AuthUser, accessToken: string, expiresAt: number | null) => {
    state = { status: "authenticated", user, accessToken, expiresAt };
    emit();
  },
  setUnauthenticated: () => {
    state = { status: "unauthenticated", user: null, accessToken: null, expiresAt: null };
    emit();
  },
};

export function useAuthState(): State {
  return useSyncExternalStore(
    (l) => authStore.subscribe(l),
    () => authStore.getState(),
    () => authStore.getState(),
  );
}

// ---------- low-level fetch helpers (no dependency on api.ts to avoid cycles) ----------

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(MC_REFRESH_KEY);
  } catch {
    return null;
  }
}

function setStoredRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(MC_REFRESH_KEY, token);
    else window.localStorage.removeItem(MC_REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

async function parseJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function authFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers ?? {}),
    },
  });
}

type LoginResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  user?: AuthUser;
};

function computeExpiresAt(expiresIn?: number): number | null {
  if (!expiresIn || !Number.isFinite(expiresIn)) return null;
  return Date.now() + expiresIn * 1000;
}

function normalizeUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.user && typeof p.user === "object") return p.user as AuthUser;
  if (typeof p.id === "string") return p as AuthUser;
  return null;
}

// ---------- public API ----------

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await authFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await parseJson<{ message?: string }>(res);
    if (res.status === 401 || res.status === 403) {
      throw new Error(body?.message ?? "Invalid email or password.");
    }
    throw new Error(body?.message ?? `Login failed (${res.status})`);
  }
  const data = (await parseJson<LoginResponse>(res)) ?? ({} as LoginResponse);
  if (!data.access_token) throw new Error("Login response missing access_token");

  if (data.refresh_token) setStoredRefreshToken(data.refresh_token);

  let user = data.user ?? null;
  if (!user) user = await fetchMe(data.access_token);
  if (!user) throw new Error("Could not load user profile after login");

  authStore.setAuthenticated(user, data.access_token, computeExpiresAt(data.expires_in));
  return user;
}

export async function fetchMe(accessToken?: string): Promise<AuthUser | null> {
  const token = accessToken ?? authStore.getAccessToken();
  if (!token) return null;
  const res = await authFetch("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return normalizeUser(await parseJson(res));
}

/** Refresh the access token; returns the new token or null on failure. */
export async function refreshSession(): Promise<string | null> {
  const stored = getStoredRefreshToken();
  const body = stored ? JSON.stringify({ refresh_token: stored }) : undefined;
  const res = await authFetch("/auth/refresh", { method: "POST", body });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      setStoredRefreshToken(null);
      authStore.setUnauthenticated();
    }
    return null;
  }
  const data = (await parseJson<LoginResponse>(res)) ?? ({} as LoginResponse);
  if (!data.access_token) return null;
  if (data.refresh_token) setStoredRefreshToken(data.refresh_token);

  let user = data.user ?? authStore.getState().user;
  if (!user) user = await fetchMe(data.access_token);
  if (!user) {
    authStore.setUnauthenticated();
    return null;
  }
  authStore.setAuthenticated(user, data.access_token, computeExpiresAt(data.expires_in));
  return data.access_token;
}

export async function logout(): Promise<void> {
  const token = authStore.getAccessToken();
  try {
    await authFetch("/auth/logout", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    /* best effort */
  }
  setStoredRefreshToken(null);
  authStore.setUnauthenticated();
}

/** Boot-time session restore. Attempts refresh; falls back to /auth/me. */
export async function bootstrapAuth(): Promise<void> {
  authStore.setLoading();
  try {
    const token = await refreshSession();
    if (token) return;
    const user = await fetchMe();
    if (user) {
      // We have a user but no fresh token; keep loading→unauth so callers stop waiting.
      authStore.setUnauthenticated();
    } else {
      authStore.setUnauthenticated();
    }
  } catch {
    authStore.setUnauthenticated();
  }
}
