// Central API client for the media-catalog backend.
// All HTTP traffic to api.mediarosenqvist.com flows through here.

import { authStore } from "@/lib/auth";

const env = import.meta.env as Record<string, string | undefined>;
export const API_BASE_URL = (env.VITE_API_BASE_URL ?? "https://api.mediarosenqvist.com").replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** When true, omit the Authorization header (public endpoints). */
  skipAuth?: boolean;
  /** When true, send cookies for refresh-cookie endpoints. */
  credentials?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: ApiOptions["query"]): string {
  const base = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!query) return base;
  const url = new URL(base);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function apiRequest<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, query, skipAuth, credentials, signal } = opts;
  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };

  if (!skipAuth) {
    const token = authStore.getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
      payload = body as BodyInit;
    } else {
      finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json";
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: finalHeaders,
    body: payload,
    signal,
    credentials: credentials ? "include" : "same-origin",
  });

  let parsed: unknown = undefined;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (res.ok) return parsed as T;

  const message =
    (parsed && typeof parsed === "object" && "message" in parsed
      ? String((parsed as { message?: unknown }).message ?? "")
      : "") || `Request failed (${res.status})`;
  throw new ApiError(message, res.status, parsed);
}

export const api = {
  get: <T,>(path: string, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T,>(path: string, body?: unknown, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  put: <T,>(path: string, body?: unknown, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "PUT", body }),
  patch: <T,>(path: string, body?: unknown, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T,>(path: string, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};

// ---------- legacy helper kept for catalog/track pages (public, no auth) ----------

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    for (const key of ["data", "items", "results", "tracks", "artists", "releases"]) {
      if (Array.isArray(v[key])) return v[key] as T[];
    }
    if (v.data && typeof v.data === "object") {
      const d = v.data as Record<string, unknown>;
      for (const key of ["items", "results"]) {
        if (Array.isArray(d[key])) return d[key] as T[];
      }
    }
  }
  return [];
}

export type CatalogTrack = {
  id: string;
  title?: string | null;
  status?: string | null;
  artist_name?: string | null;
  artist?: string | null;
  release_title?: string | null;
  release?: string | null;
  artwork_url?: string | null;
  image_url?: string | null;
  cover_url?: string | null;
  duration_seconds?: number | null;
  duration?: number | null;
  isrc?: string | null;
  genre?: string | null;
  [key: string]: unknown;
};

export const getHealth = () => apiRequest("/health", { skipAuth: true });
export const getTracks = async () =>
  asArray<CatalogTrack>(await apiRequest("/api/v1/music/tracks", { skipAuth: true }));
export const getTrackById = (id: string) =>
  apiRequest<CatalogTrack>(`/api/v1/music/tracks/${id}`, { skipAuth: true });
export const getArtists = async () =>
  asArray(await apiRequest("/api/v1/music/artists", { skipAuth: true }));
export const getReleases = async () =>
  asArray(await apiRequest("/api/v1/music/releases", { skipAuth: true }));
export const getPreviewUrl = (trackId: string) => `${API_BASE_URL}/playback/${trackId}/preview`;
