// Central API client for the music-catalog-core backend.
// All requests target VITE_API_BASE_URL and attach a Clerk Bearer token when available.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
export const API_BASE_URL = BASE_URL;
export function apiUrl(path: string) {
  const base = BASE_URL.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

// Token getter is injected at runtime by AuthProvider (Clerk).
// Keeping it as a mutable holder avoids importing Clerk into SSR/server code.
type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;

export function setApiTokenGetter(fn: TokenGetter | null) {
  tokenGetter = fn;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOpts = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Set true to skip Authorization header (for public endpoints) */
  anonymous?: boolean;
};

function buildUrl(path: string, query?: RequestOpts["query"]) {
  const base = BASE_URL.replace(/\/$/, "");
  const url = new URL(path.startsWith("/") ? `${base}${path}` : `${base}/${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { body, query, anonymous, headers, ...rest } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  if (!anonymous && tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) finalHeaders.Authorization = `Bearer ${token}`;
    } catch {
      // ignore — request continues unauthenticated, server decides
    }
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? (body instanceof FormData ? (body as unknown as BodyInit) : JSON.stringify(body)) : undefined,
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const isCors = /CORS|Cross-Origin|preflight/i.test(errMsg);
    throw new ApiError(
      0,
      isCors
        ? `CORS error: backend at ${BASE_URL || "(VITE_API_BASE_URL not set)"} did not allow this origin. Check Access-Control-Allow-Origin.`
        : `Network error: could not reach ${BASE_URL || "(VITE_API_BASE_URL not set)"}${path}. ${errMsg}`,
      { cause: errMsg },
    );
  }

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }

  if (!res.ok) {
    const serverMsg =
      (parsed && typeof parsed === "object" && "message" in parsed && typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : null) ??
      (typeof parsed === "string" ? parsed : null);

    let msg: string;
    if (res.status === 401) msg = `Auth error (401): not authenticated. ${serverMsg ?? "Sign in and retry."}`;
    else if (res.status === 403) msg = `Auth error (403): forbidden. ${serverMsg ?? "Your account lacks access."}`;
    else if (res.status >= 500) msg = `Backend error (${res.status}): the server failed. ${serverMsg ?? "Check backend logs."}`;
    else msg = serverMsg ?? `Request failed (${res.status})`;

    throw new ApiError(res.status, msg, parsed);
  }
  return parsed as T;
}

// ---------- Domain types ----------
export type HealthStatus = {
  status: string;
  service?: string;
  version?: string;
  timestamp?: string;
  [k: string]: unknown;
};

export type Artist = {
  id: string;
  name?: string;
  displayName?: string;
  display_name?: string;
  country?: string;
  imageUrl?: string;
  image_url?: string;
  createdAt?: string;
};

export type Release = {
  id: string;
  title: string;
  artistId?: string;
  artist_id?: string;
  coverUrl?: string;
  releaseDate?: string;
  type?: string;
  status?: string;
};

export type Track = {
  id: string;
  title: string;
  artistId?: string;
  artist_id?: string;
  releaseId?: string;
  release_id?: string;
  durationSec?: number;
  isrc?: string;
  status?: string;
};

export type UploadInit = {
  assetId: string;
  uploadUrl: string;
  method?: string;
  headers?: Record<string, string>;
  key?: string;
};

export type UploadComplete = {
  assetId: string;
  status: string;
  url?: string;
};

// ---------- Domain helpers ----------
export const api = {
  // Health
  health: () => apiRequest<HealthStatus>("/health", { anonymous: true }),
  healthDatabase: () => apiRequest<HealthStatus>("/health/database", { anonymous: true }),
  healthStorage: () => apiRequest<HealthStatus>("/health/storage", { anonymous: true }),
  healthAuth: () => apiRequest<HealthStatus>("/health/auth-config", { anonymous: true }),
  healthRedis: () => apiRequest<HealthStatus>("/health/redis", { anonymous: true }),

  // Catalog
  listArtists: () => apiRequest<Artist[]>("/api/artists"),
  getArtist: (id: string) => apiRequest<Artist>(`/api/artists/${id}`),
  createArtist: (body: Partial<Artist>) =>
    apiRequest<Artist>("/api/artists", { method: "POST", body }),

  listReleases: () => apiRequest<Release[]>("/api/releases"),
  getRelease: (id: string) => apiRequest<Release>(`/api/releases/${id}`),
  createRelease: (body: Partial<Release>) =>
    apiRequest<Release>("/api/releases", { method: "POST", body }),

  listTracks: () => apiRequest<Track[]>("/api/tracks"),
  getTrack: (id: string) => apiRequest<Track>(`/api/tracks/${id}`),
  createTrack: (body: Partial<Track>) =>
    apiRequest<Track>("/api/tracks", { method: "POST", body }),

  // Uploads
  initUpload: (body: { filename: string; contentType: string; size?: number; trackId?: string }) =>
    apiRequest<UploadInit>("/api/assets/uploads/init", { method: "POST", body }),
  completeUpload: (assetId: string, body?: Record<string, unknown>) =>
    apiRequest<UploadComplete>("/api/assets/uploads/complete", {
      method: "POST",
      body: { assetId, ...(body ?? {}) },
    }),
};
