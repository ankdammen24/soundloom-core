// Central API client for the music-catalog-core backend.
// All requests target VITE_API_BASE_URL and attach a Bearer token (from the app's auth module) only for protected calls.

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

// Token getter is injected at runtime by AuthProvider.
// Keeping it as a mutable holder avoids importing auth state into SSR/server code.
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
    hints.push("DNS/HTTPS/TLS blocked: the browser may be unable to resolve the host, complete TLS, trust the certificate for this hostname, or reach the API over HTTPS.");
    hints.push("Cloudflare/security block: a WAF, bot challenge, redirect, or blocked error response without CORS headers can surface as TypeError: Failed to fetch.");
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
      // Deliberately no credentials option and no request mode override.
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
  removeAuthorization(finalHeaders);

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
    if (res.status === 401) {
      msg = `Du behöver logga in igen. ${serverMsg ?? ""}`.trim();
      try {
        const mod = await import("@/lib/connectAuth");
        mod.clearLocalSession();
        if (typeof window !== "undefined"
          && !window.location.pathname.startsWith("/sign-in")
          && !window.location.pathname.startsWith("/auth/callback")) {
          const redirect = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.assign(`/sign-in?redirect=${redirect}`);
        }
      } catch { /* ignore */ }
    }
    else if (res.status === 403) msg = `Du saknar behörighet för den här åtgärden. ${serverMsg ?? ""}`.trim();
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

export type ProcessingEvent = {
  step: string;
  status?: "pending" | "active" | "done" | "failed" | string;
  ts?: string;
  error?: string;
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
  audioUrl?: string;
  previewUrl?: string;
  processingEvents?: ProcessingEvent[];
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

// ---------- Admin / Ops types ----------
export type AdminSummary = {
  workersUp?: number;
  workersTotal?: number;
  queueDepth?: number;
  failedJobs24h?: number;
  storageUsedBytes?: number;
  storageQuotaBytes?: number;
  processingP95Ms?: number;
  requestsPerMin?: number;
  [k: string]: unknown;
};

export type Worker = {
  id: string;
  host?: string;
  version?: string;
  status?: "online" | "offline" | "degraded" | string;
  lastHeartbeat?: string;
  activeJobs?: number;
  [k: string]: unknown;
};

export type QueueStats = {
  name: string;
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
  delayed?: number;
  paused?: boolean;
  history?: number[];
};

export type StorageStats = {
  name: string;
  usedBytes?: number;
  quotaBytes?: number;
  objectCount?: number;
  egress24hBytes?: number;
};

export type ProcessingMetrics = {
  range: string;
  throughputPerMin?: number;
  successRate?: number;
  byType?: Array<{
    type: string;
    throughput?: number;
    successRate?: number;
    p50Ms?: number;
    p95Ms?: number;
    p99Ms?: number;
  }>;
};

export type Job = {
  id: string;
  queue: string;
  type?: string;
  attempts?: number;
  maxAttempts?: number;
  error?: string;
  payload?: unknown;
  failedAt?: string;
};

export type LogEntry = {
  id: string;
  ts: string;
  level: "debug" | "info" | "warn" | "error" | string;
  service?: string;
  traceId?: string;
  message: string;
  fields?: Record<string, unknown>;
};

export type AuditEvent = {
  id: string;
  ts: string;
  actor?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ip?: string;
  before?: unknown;
  after?: unknown;
};

export type ApiUsage = {
  range: string;
  totalRequests?: number;
  byRoute?: Array<{ route: string; count: number; p95Ms?: number }>;
  byStatus?: Record<string, number>;
  topConsumers?: Array<{ id: string; label?: string; count: number }>;
  rateLimitHits?: number;
};

export type HealthAggregate = {
  status: string;
  checks?: Record<string, HealthStatus>;
  [k: string]: unknown;
};

export type Page<T> = {
  items: T[];
  total?: number;
  nextCursor?: string | null;
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
  updateArtist: (id: string, body: Partial<Artist>) =>
    apiRequest<Artist>(`/api/artists/${id}`, { method: "PATCH", body }),

  listReleases: () => apiRequest<Release[]>("/api/releases"),
  getRelease: (id: string) => apiRequest<Release>(`/api/releases/${id}`),
  createRelease: (body: Partial<Release>) =>
    apiRequest<Release>("/api/releases", { method: "POST", body }),
  updateRelease: (id: string, body: Partial<Release>) =>
    apiRequest<Release>(`/api/releases/${id}`, { method: "PATCH", body }),

  listTracks: () => apiRequest<Track[]>("/api/tracks"),
  getTrack: (id: string) => apiRequest<Track>(`/api/tracks/${id}`),
  createTrack: (body: Partial<Track>) =>
    apiRequest<Track>("/api/tracks", { method: "POST", body }),
  updateTrack: (id: string, body: Partial<Track>) =>
    apiRequest<Track>(`/api/tracks/${id}`, { method: "PATCH", body }),

  // Uploads
  initUpload: (body: { filename: string; contentType: string; size?: number; trackId?: string }) =>
    apiRequest<UploadInit>("/api/assets/uploads/init", { method: "POST", body }),
  completeUpload: (assetId: string, body?: Record<string, unknown>) =>
    apiRequest<UploadComplete>("/api/assets/uploads/complete", {
      method: "POST",
      body: { assetId, ...(body ?? {}) },
    }),

  // Admin / Ops
  admin: {
    summary: () => apiRequest<AdminSummary>("/api/admin/summary"),
    workers: () => apiRequest<Worker[]>("/api/admin/workers"),
    queues: () => apiRequest<QueueStats[]>("/api/admin/queues"),
    storage: () => apiRequest<StorageStats[]>("/api/admin/storage"),
    processing: (range: string) =>
      apiRequest<ProcessingMetrics>("/api/admin/metrics/processing", { query: { range } }),
    failedJobs: (q: { queue?: string; since?: string; cursor?: string; limit?: number } = {}) =>
      apiRequest<Page<Job>>("/api/admin/jobs/failed", { query: q }),
    retryJob: (id: string) =>
      apiRequest<void>(`/api/admin/jobs/${id}/retry`, { method: "POST" }),
    bulkRetry: (ids: string[]) =>
      apiRequest<void>("/api/admin/jobs/bulk-retry", { method: "POST", body: { ids } }),
    discardJob: (id: string) =>
      apiRequest<void>(`/api/admin/jobs/${id}`, { method: "DELETE" }),
    logs: (q: { level?: string; service?: string; traceId?: string; q?: string; since?: string; cursor?: string; limit?: number } = {}) =>
      apiRequest<Page<LogEntry>>("/api/admin/logs", { query: q }),
    audit: (q: { actor?: string; action?: string; resourceType?: string; since?: string; cursor?: string; limit?: number } = {}) =>
      apiRequest<Page<AuditEvent>>("/api/admin/audit", { query: q }),
    apiUsage: (range: string) =>
      apiRequest<ApiUsage>("/api/admin/metrics/api-usage", { query: { range } }),
    healthAll: () => apiRequest<HealthAggregate>("/health/all", { anonymous: true }),
  },
};
