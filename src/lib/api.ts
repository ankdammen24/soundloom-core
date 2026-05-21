// Central API client for the music-catalog-core backend.
// All requests target VITE_API_BASE_URL and attach a Clerk Bearer token only for protected calls.

const BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").trim().replace(/\/+$/, "");
export const API_BASE_URL = BASE_URL;

function normalizePath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    throw new ApiError(0, "API calls must pass a path only. The host is always resolved from VITE_API_BASE_URL.");
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function apiUrl(path: string) {
  const normalizedPath = normalizePath(path);
  if (!BASE_URL) return `(VITE_API_BASE_URL not configured)${normalizedPath}`;
  return `${BASE_URL}${normalizedPath}`;
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
  diagnostics?: FetchDiagnostics;
  constructor(status: number, message: string, body?: unknown, diagnostics?: FetchDiagnostics) {
    super(message);
    this.status = status;
    this.body = body;
    this.diagnostics = diagnostics;
  }
}

export type FetchDiagnostics = {
  finalUrl: string;
  method: string;
  authorizationAttached: boolean;
  requestHeaders: Record<string, string>;
  errorName?: string;
  errorMessage?: string;
  hints: string[];
};

type RequestOpts = {
  method?: string;
  headers?: HeadersInit;
  signal?: AbortSignal | null;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Set true to skip Authorization header (for public endpoints) */
  anonymous?: boolean;
};

function buildUrl(path: string, query?: RequestOpts["query"]) {
  if (!BASE_URL) {
    throw new ApiError(0, "VITE_API_BASE_URL is not configured; refusing to call a relative API path.");
  }
  const url = new URL(normalizePath(path), BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
  const record: Record<string, string> = {};
  if (!headers) return record;
  new Headers(headers).forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function removeAuthorization(headers: Record<string, string>) {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === "authorization") delete headers[key];
  }
}

function browserOrigin() {
  return typeof window === "undefined" ? undefined : window.location.origin;
}

export function getFetchDiagnostics(input: {
  finalUrl: string;
  method: string;
  authorizationAttached: boolean;
  requestHeaders: Record<string, string>;
  error?: Pick<Error, "name" | "message">;
}): FetchDiagnostics {
  const { finalUrl, method, authorizationAttached, requestHeaders, error } = input;
  const hints: string[] = [];
  const origin = browserOrigin();

  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(finalUrl);
  } catch {
    hints.push("Invalid URL: check VITE_API_BASE_URL formatting.");
  }

  if (parsedUrl?.protocol === "http:" && origin?.startsWith("https://")) {
    hints.push("Mixed content blocked: an HTTPS frontend cannot call an HTTP API URL.");
  }

  const isOpaqueBrowserFailure = error?.name === "TypeError" && /Failed to fetch|NetworkError|Load failed/i.test(error.message ?? "");
  const isCrossOrigin = Boolean(origin && parsedUrl && parsedUrl.origin !== origin);

  if (isCrossOrigin && isOpaqueBrowserFailure) {
    hints.push("CORS blocked: the browser may have rejected the response or a preflight/error response without matching CORS headers.");
    hints.push("DNS/HTTPS blocked: the browser may be unable to resolve the host, complete TLS, or reach the API over HTTPS.");
    hints.push("Cloudflare/security block: a WAF, bot challenge, redirect, or blocked error page can surface as TypeError: Failed to fetch.");
  }

  if (origin?.includes("id-preview--") && origin.endsWith(".lovable.app")) {
    hints.push("Lovable Preview diagnostic: if curl and the published site work, the preview fetch proxy may be the blocker.");
  }

  if (hints.length === 0) hints.push("No browser-side fallback condition matched; inspect the Network tab for the blocked request details.");

  return {
    finalUrl,
    method,
    authorizationAttached,
    requestHeaders,
    errorName: error?.name,
    errorMessage: error?.message,
    hints,
  };
}

function redactedHeaders(headers: Record<string, string>) {
  const copy = { ...headers };
  for (const key of Object.keys(copy)) {
    if (key.toLowerCase() === "authorization") copy[key] = "Bearer <redacted>";
  }
  return copy;
}

async function safeFetch(finalUrl: string, init: {
  method: string;
  headers: Record<string, string>;
  body?: BodyInit;
  signal?: AbortSignal | null;
  authorizationAttached: boolean;
}) {
  const requestHeaders = redactedHeaders(init.headers);
  // eslint-disable-next-line no-console
  console.debug("[api] →", init.method, finalUrl, {
    finalUrl,
    method: init.method,
    authorizationAttached: init.authorizationAttached,
    headers: requestHeaders,
    hasBody: init.body !== undefined,
  });

  if (/^http:\/\//i.test(finalUrl)) {
    const diagnostics = getFetchDiagnostics({
      finalUrl,
      method: init.method,
      authorizationAttached: init.authorizationAttached,
      requestHeaders,
      error: { name: "MixedContent", message: "Refusing insecure http:// API call." },
    });
    throw new ApiError(0, `Refusing insecure http:// API call: ${finalUrl}. VITE_API_BASE_URL must be https://.`, { diagnostics }, diagnostics);
  }

  try {
    return await fetch(finalUrl, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      signal: init.signal ?? undefined,
      // Deliberately no credentials and no mode. Never use credentials: "include" or mode: "no-cors".
    });
  } catch (e) {
    const err = e as Error;
    const diagnostics = getFetchDiagnostics({
      finalUrl,
      method: init.method,
      authorizationAttached: init.authorizationAttached,
      requestHeaders,
      error: err,
    });
    // eslint-disable-next-line no-console
    console.error("[api] ✗ fetch failed", diagnostics);
    throw new ApiError(
      0,
      `Network fetch failed (${diagnostics.errorName ?? "Error"}): ${diagnostics.errorMessage ?? "Unknown error"}. ${diagnostics.hints.join(" ")}`,
      { diagnostics },
      diagnostics,
    );
  }
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { body, query, anonymous, headers, method: requestedMethod, signal } = opts;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...headersToRecord(headers),
  };
  if (anonymous) removeAuthorization(finalHeaders);

  let attachedAuth = false;
  if (!anonymous && tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
        attachedAuth = true;
      }
    } catch {
      // ignore — request continues unauthenticated, server decides
    }
  }

  const finalUrl = buildUrl(path, query);
  const method = requestedMethod ?? "GET";

  const res = await safeFetch(finalUrl, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? (isFormData ? (body as unknown as BodyInit) : JSON.stringify(body)) : undefined,
    signal,
    authorizationAttached: attachedAuth,
  });

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
