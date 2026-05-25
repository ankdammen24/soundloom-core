// Auth API client — talks to api.mediarosenqvist.com /auth/* endpoints.

import { apiRequest, ApiError } from "@/lib/api";
import type { AuthUser } from "./store";

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string | null;
  user: AuthUser;
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = { email: string; password: string; displayName?: string };

/** Normalize backend variations: {accessToken|access_token|token}, {refreshToken|refresh_token}. */
function normalize(raw: unknown): AuthResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const accessToken =
    (r.accessToken as string | undefined) ??
    (r.access_token as string | undefined) ??
    (r.token as string | undefined) ??
    "";
  const refreshToken =
    (r.refreshToken as string | undefined) ??
    (r.refresh_token as string | undefined) ??
    null;
  const user = (r.user as AuthUser | undefined) ?? ({ id: "" } as AuthUser);
  if (!accessToken) {
    throw new ApiError(500, "Auth response missing accessToken.");
  }
  return { accessToken, refreshToken, user };
}

export const authClient = {
  login: async (input: LoginInput): Promise<AuthResponse> => {
    const raw = await apiRequest<unknown>("/auth/login", {
      method: "POST",
      body: input,
      anonymous: true,
    });
    return normalize(raw);
  },

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const raw = await apiRequest<unknown>("/auth/register", {
      method: "POST",
      body: input,
      anonymous: true,
    });
    return normalize(raw);
  },

  logout: async (refreshToken: string | null): Promise<void> => {
    try {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
        body: refreshToken ? { refreshToken } : undefined,
      });
    } catch {
      /* best-effort */
    }
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const raw = await apiRequest<unknown>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      anonymous: true,
    });
    return normalize(raw);
  },

  me: async (accessTokenOverride?: string): Promise<AuthUser> => {
    const headers: Record<string, string> = {};
    if (accessTokenOverride) headers.Authorization = `Bearer ${accessTokenOverride}`;
    const raw = await apiRequest<unknown>("/auth/me", {
      anonymous: Boolean(accessTokenOverride),
      headers: accessTokenOverride ? headers : undefined,
    });
    const r = (raw ?? {}) as Record<string, unknown>;
    return ((r.user as AuthUser | undefined) ?? (r as AuthUser));
  },
};
