// Central API client for the media-catalog backend.
// All catalog/upload/health calls flow through this module.
//
// - Reads base URL from VITE_API_BASE_URL
// - Attaches the Supabase access token as Bearer auth
// - Maps 401 → redirect to /sign-in, 403 → AccessDeniedError,
//   429 → RateLimitError, other non-2xx → ApiError

import { supabase } from "@/integrations/supabase/client";
import { mcAuthStore } from "@/lib/mc-auth/store";

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
export class UnauthorizedError extends ApiError {
  constructor(body?: unknown) {
    super("You need to sign in again.", 401, body);
    this.name = "UnauthorizedError";
  }
}
export class AccessDeniedError extends ApiError {
  constructor(body?: unknown) {
    super("Access denied — you do not have permission for this action.", 403, body);
    this.name = "AccessDeniedError";
  }
}
export class RateLimitError extends ApiError {
  retryAfterSeconds?: number;
  constructor(body?: unknown, retryAfterSeconds?: number) {
    super(
      retryAfterSeconds
        ? `Too many requests. Please wait ${retryAfterSeconds}s and try again.`
        : "Too many requests. Please slow down and try again shortly.",
      429,
      body,
    );
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Skip auth header (used for /health probes). */
  skipAuth?: boolean;
  signal?: AbortSignal;
};

async function getAccessToken(): Promise<string | null> {
  // Prefer the media-catalog backend token when present, fall back to Supabase.
  const mcToken = mcAuthStore.getAccessToken();
  if (mcToken) return mcToken;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const base = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!query) return base;
  const url = new URL(base);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

function redirectToSignIn() {
  if (typeof window === "undefined") return;
  const here = window.location.pathname + window.location.search;
  if (window.location.pathname === "/sign-in") return;
  const url = new URL("/sign-in", window.location.origin);
  url.searchParams.set("redirect", here);
  window.location.href = url.toString();
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, query, skipAuth, signal } = opts;
  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };

  if (!skipAuth) {
    const token = await getAccessToken();
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
  });

  // Try to parse JSON body (best effort)
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

  const msg =
    (parsed && typeof parsed === "object" && "message" in parsed && typeof (parsed as { message: unknown }).message === "string"
      ? (parsed as { message: string }).message
      : undefined) ?? `Request failed (${res.status})`;

  if (res.status === 401) {
    redirectToSignIn();
    throw new UnauthorizedError(parsed);
  }
  if (res.status === 403) throw new AccessDeniedError(parsed);
  if (res.status === 429) {
    const retry = Number(res.headers.get("Retry-After"));
    throw new RateLimitError(parsed, Number.isFinite(retry) ? retry : undefined);
  }
  throw new ApiError(msg, res.status, parsed);
}

export const api = {
  get: <T,>(path: string, opts?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T,>(path: string, body?: unknown, opts?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  put: <T,>(path: string, body?: unknown, opts?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "PUT", body }),
  patch: <T,>(path: string, body?: unknown, opts?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T,>(path: string, opts?: Omit<ApiRequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};
