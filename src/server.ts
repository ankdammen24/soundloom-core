import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const PROXY_ROUTES = new Map<string, string>([
  ["/api/health", "/api/v1/health"],
  ["/api/releases", "/api/v1/releases"],
  ["/api/artists", "/api/v1/artists"],
  ["/api/tracks", "/api/v1/tracks"],
  ["/api/search", "/api/v1/search"],
  ["/api/playback/token", "/api/v1/playback/token"],
  ["/api/auth/login", "/api/v1/auth/login"],
  ["/api/auth/refresh", "/api/v1/auth/refresh"],
  ["/api/auth/logout", "/api/v1/auth/logout"],
  ["/api/auth/logout-all", "/api/v1/auth/logout-all"],
  ["/api/api-keys", "/api/v1/api-keys"],
]);

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

function resolveMusicApiUrl(env: unknown): string | undefined {
  const envRecord = (env && typeof env === "object" ? (env as Record<string, unknown>) : {}) ?? {};
  const value = envRecord.MUSIC_API_URL;
  if (typeof value === "string" && value.length > 0) return value;
  return process.env.MUSIC_API_URL;
}

async function maybeProxyApiRequest(request: Request, env: unknown): Promise<Response | null> {
  const requestUrl = new URL(request.url);
  const backendPath = PROXY_ROUTES.get(requestUrl.pathname);
  if (!backendPath) return null;

  const apiBase = resolveMusicApiUrl(env);
  if (!apiBase) {
    return Response.json(
      { error: "MUSIC_API_URL is not configured on the server." },
      { status: 500 },
    );
  }

  const targetUrl = new URL(backendPath + requestUrl.search, apiBase);
  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body:
        request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: upstreamResponse.headers,
    });
  } catch {
    return Response.json({ error: "Could not reach music-catalog-core backend." }, { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const proxiedResponse = await maybeProxyApiRequest(request, env);
      if (proxiedResponse) return proxiedResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
