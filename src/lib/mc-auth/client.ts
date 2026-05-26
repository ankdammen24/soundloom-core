// Thin HTTP client for the media-catalog auth endpoints.
// Access token is kept in memory by mcAuthStore. The refresh token is expected
// to live in an httpOnly cookie set by the backend (credentials: "include"),
// with a localStorage fallback if the backend returns refresh_token in JSON.

import { API_BASE_URL } from "@/lib/api/client";
import { mcAuthStore, type McUser } from "./store";

const REFRESH_TOKEN_LS_KEY = "mc.refresh_token";

type LoginResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number; // seconds
  refresh_token?: string;
  user?: McUser;
};

type MeResponse = McUser | { user: McUser };

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_LS_KEY);
  } catch {
    return null;
  }
}

function setStoredRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(REFRESH_TOKEN_LS_KEY, token);
    else window.localStorage.removeItem(REFRESH_TOKEN_LS_KEY);
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

function computeExpiresAt(expiresIn?: number): number | null {
  if (!expiresIn || !Number.isFinite(expiresIn)) return null;
  return Date.now() + expiresIn * 1000;
}

function normalizeUser(payload: MeResponse | null): McUser | null {
  if (!payload) return null;
  if ("user" in (payload as Record<string, unknown>)) {
    return (payload as { user: McUser }).user ?? null;
  }
  return payload as McUser;
}

async function authFetch(path: string, init: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  return fetch(url, {
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

export async function mcLogin(email: string, password: string): Promise<McUser> {
  const res = await authFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await parseJson<{ message?: string }>(res);
    throw new Error(body?.message ?? `Login failed (${res.status})`);
  }
  const data = (await parseJson<LoginResponse>(res)) ?? ({} as LoginResponse);
  if (!data.access_token) throw new Error("Login response missing access_token");

  if (data.refresh_token) setStoredRefreshToken(data.refresh_token);

  let user = data.user ?? null;
  if (!user) {
    user = await mcFetchMe(data.access_token);
  }
  if (!user) throw new Error("Could not load user profile after login");

  mcAuthStore.setAuthenticated(user, data.access_token, computeExpiresAt(data.expires_in));
  return user;
}

export async function mcFetchMe(accessToken?: string): Promise<McUser | null> {
  const token = accessToken ?? mcAuthStore.getAccessToken();
  if (!token) return null;
  const res = await authFetch("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null; // endpoint not deployed yet
  if (!res.ok) return null;
  const data = await parseJson<MeResponse>(res);
  return normalizeUser(data);
}

/**
 * Try to refresh the access token. Uses the refresh cookie first; falls back
 * to a refresh_token in localStorage if the backend returned one on login.
 * Returns the new access token, or null if refresh failed.
 */
export async function mcRefresh(): Promise<string | null> {
  const storedRefresh = getStoredRefreshToken();
  const body = storedRefresh ? JSON.stringify({ refresh_token: storedRefresh }) : undefined;

  const res = await authFetch("/auth/refresh", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      setStoredRefreshToken(null);
      mcAuthStore.setUnauthenticated();
    }
    return null;
  }
  const data = (await parseJson<LoginResponse>(res)) ?? ({} as LoginResponse);
  if (!data.access_token) return null;

  if (data.refresh_token) setStoredRefreshToken(data.refresh_token);

  const expiresAt = computeExpiresAt(data.expires_in);
  const user = data.user ?? (await mcFetchMe(data.access_token));
  if (user) {
    mcAuthStore.setAuthenticated(user, data.access_token, expiresAt);
  } else {
    mcAuthStore.updateToken(data.access_token, expiresAt);
  }
  return data.access_token;
}

export async function mcLogout(): Promise<void> {
  try {
    await authFetch("/auth/logout", { method: "POST" });
  } catch {
    /* ignore network errors on logout */
  } finally {
    setStoredRefreshToken(null);
    mcAuthStore.setUnauthenticated();
  }
}

/**
 * Boot the auth state: try /auth/me using whatever access token we may already
 * have, and if that fails attempt a refresh. Safe to call on app start.
 */
export async function mcBootstrap(): Promise<void> {
  mcAuthStore.setLoading();
  try {
    // No access token in memory yet — try refresh first (cookie or stored refresh).
    const token = await mcRefresh();
    if (!token) {
      mcAuthStore.setUnauthenticated();
    }
  } catch {
    mcAuthStore.setUnauthenticated();
  }
}
