// Media Rosenqvist Connect — central auth gateway client.
// OAuth2 Authorization Code + PKCE. Tokens stored in localStorage; PKCE state in sessionStorage.

const CONNECT_BASE_URL = ((import.meta.env.VITE_CONNECT_BASE_URL as string | undefined) ?? "")
  .trim()
  .replace(/\/+$/, "");
const CLIENT_ID = ((import.meta.env.VITE_CONNECT_CLIENT_ID as string | undefined) ?? "").trim();
const REDIRECT_URI = ((import.meta.env.VITE_CONNECT_REDIRECT_URI as string | undefined) ?? "").trim();
const AUDIENCE = ((import.meta.env.VITE_CONNECT_AUDIENCE as string | undefined) ?? "music-catalog-core").trim();

export const connectConfigured = Boolean(CONNECT_BASE_URL && CLIENT_ID && REDIRECT_URI);

const SESSION_KEY = "connect.session";
const PKCE_KEY = "connect.pkce";

export type ConnectClaims = {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  aud?: string | string[];
  iss?: string;
  scp?: string;
  scope?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  roles?: string[];
  permissions?: string[];
  [k: string]: unknown;
};

export type ConnectSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  tokenType?: string;
};

export type ConnectUser = {
  id: string;
  email?: string;
  name?: string;
  displayName?: string;
  roles: string[];
  permissions: string[];
  claims: ConnectClaims;
};

// ---------- Storage ----------
function readSession(): ConnectSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ConnectSession;
    if (!s.accessToken) return null;
    return s;
  } catch {
    return null;
  }
}

function writeSession(s: ConnectSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

// ---------- PKCE ----------
function randomString(len = 64): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkceChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

// ---------- JWT ----------
export function decodeJwt(token: string): ConnectClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as ConnectClaims;
  } catch {
    return null;
  }
}

function extractPermissions(claims: ConnectClaims): string[] {
  const out = new Set<string>();
  if (Array.isArray(claims.permissions)) for (const p of claims.permissions) if (typeof p === "string") out.add(p);
  const scp = claims.scp ?? claims.scope;
  if (typeof scp === "string") for (const p of scp.split(/\s+/).filter(Boolean)) out.add(p);
  return [...out];
}

function extractRoles(claims: ConnectClaims): string[] {
  if (Array.isArray(claims.roles)) return claims.roles.filter((r) => typeof r === "string");
  return [];
}

// ---------- Public API ----------

export function isAuthenticated(): boolean {
  const s = readSession();
  if (!s) return false;
  return s.expiresAt > Date.now() + 1000;
}

export function getCurrentUser(): ConnectUser | null {
  const s = readSession();
  if (!s) return null;
  const claims = decodeJwt(s.accessToken);
  if (!claims) return null;
  return {
    id: claims.sub ?? "",
    email: claims.email ?? claims.preferred_username,
    name: claims.name ?? claims.preferred_username,
    displayName: claims.name ?? claims.preferred_username,
    roles: extractRoles(claims),
    permissions: extractPermissions(claims),
    claims,
  };
}

export function getRawSession(): ConnectSession | null {
  return readSession();
}

/** Returns a valid access token, refreshing if needed. Null if not signed in. */
export async function getAccessToken(): Promise<string | null> {
  const s = readSession();
  if (!s) return null;
  // 60s grace period for clock skew.
  if (s.expiresAt > Date.now() + 60_000) return s.accessToken;
  if (s.refreshToken) {
    const refreshed = await tryRefresh(s.refreshToken);
    if (refreshed) return refreshed.accessToken;
  }
  clearSession();
  return null;
}

async function tryRefresh(refreshToken: string): Promise<ConnectSession | null> {
  if (!connectConfigured) return null;
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    });
    const res = await fetch(`${CONNECT_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const session: ConnectSession = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + (Number(data.expires_in ?? 3600) * 1000),
      tokenType: data.token_type ?? "Bearer",
    };
    writeSession(session);
    return session;
  } catch {
    return null;
  }
}

/** Redirect the browser to Connect's login page. */
export async function redirectToLogin(returnTo?: string): Promise<void> {
  if (!connectConfigured) {
    throw new Error("Connect is not configured. Set VITE_CONNECT_BASE_URL, VITE_CONNECT_CLIENT_ID, VITE_CONNECT_REDIRECT_URI.");
  }
  const verifier = randomString(64);
  const challenge = await pkceChallenge(verifier);
  const state = randomString(32);
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, returnTo: returnTo ?? "/dashboard" }));

  const url = new URL(`${CONNECT_BASE_URL}/login`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("audience", AUDIENCE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "openid profile email offline_access");

  window.location.assign(url.toString());
}

export type CallbackResult = { user: ConnectUser; returnTo: string };

/** Handle the OAuth callback: exchange code for token, persist session. */
export async function handleCallback(): Promise<CallbackResult> {
  if (!connectConfigured) throw new Error("Connect is not configured.");
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const err = params.get("error");
  if (err) throw new Error(params.get("error_description") || err);
  if (!code) throw new Error("Missing authorization code in callback.");

  const rawPkce = sessionStorage.getItem(PKCE_KEY);
  if (!rawPkce) throw new Error("Missing PKCE state. Please try signing in again.");
  const { verifier, state: expectedState, returnTo } = JSON.parse(rawPkce) as {
    verifier: string; state: string; returnTo: string;
  };
  if (!state || state !== expectedState) throw new Error("State mismatch — possible CSRF, aborting.");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });

  const res = await fetch(`${CONNECT_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error("Token exchange returned no access_token.");

  const session: ConnectSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (Number(data.expires_in ?? 3600) * 1000),
    tokenType: data.token_type ?? "Bearer",
  };
  writeSession(session);
  sessionStorage.removeItem(PKCE_KEY);

  const user = getCurrentUser();
  if (!user) throw new Error("Could not read claims from access token.");
  return { user, returnTo: returnTo || "/dashboard" };
}

/** Local sign-out only — clears storage, no redirect. */
export function clearLocalSession(): void {
  clearSession();
}

/** Full logout: clear local + redirect to Connect logout endpoint. */
export function logout(): void {
  clearSession();
  if (!connectConfigured) {
    if (typeof window !== "undefined") window.location.assign("/");
    return;
  }
  const url = new URL(`${CONNECT_BASE_URL}/logout`);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("post_logout_redirect_uri", window.location.origin);
  window.location.assign(url.toString());
}

export const CONNECT_LOGIN_URL = connectConfigured
  ? `${CONNECT_BASE_URL}/login?client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&audience=${encodeURIComponent(AUDIENCE)}`
  : "";
