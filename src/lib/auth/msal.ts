// MSAL Browser (PKCE redirect) configuration for Microsoft Entra ID.

import {
  PublicClientApplication,
  type Configuration,
  type AccountInfo,
  type RedirectRequest,
  type SilentRequest,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

const clientId = (import.meta.env.VITE_ENTRA_CLIENT_ID as string | undefined)?.trim() ?? "";
const authority = (import.meta.env.VITE_ENTRA_AUTHORITY as string | undefined)?.trim() ?? "";
const audience = (import.meta.env.VITE_ENTRA_AUDIENCE as string | undefined)?.trim() ?? "";

export const msalConfigured = Boolean(clientId && authority && audience);

/** Single API scope: `api://<client-id>/.default` — requires the app's API perms in Entra. */
export const apiScopes = audience ? [`${audience}/.default`] : [];

const redirectUri =
  typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "/auth/callback";
const postLogoutRedirectUri =
  typeof window !== "undefined" ? window.location.origin : "/";

const config: Configuration = {
  auth: {
    clientId: clientId || "missing-client-id",
    authority: authority || "https://login.microsoftonline.com/common",
    redirectUri,
    postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const msalInstance = new PublicClientApplication(config);

let initPromise: Promise<void> | null = null;
export function initMsal(): Promise<void> {
  if (!initPromise) initPromise = msalInstance.initialize();
  return initPromise;
}

export function getActiveAccount(): AccountInfo | null {
  return msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0] ?? null;
}

export function buildLoginRequest(redirect?: string): RedirectRequest {
  return {
    scopes: apiScopes,
    state: redirect ? encodeURIComponent(redirect) : undefined,
    prompt: "select_account",
  };
}

/** Acquire an access token silently; falls back to redirect on interaction required. */
export async function acquireAccessToken(): Promise<string | null> {
  const account = getActiveAccount();
  if (!account) return null;
  const req: SilentRequest = { scopes: apiScopes, account };
  try {
    const res = await msalInstance.acquireTokenSilent(req);
    return res.accessToken ?? null;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      // Fire-and-forget redirect; caller will see null and trigger re-auth UI/guard.
      void msalInstance.acquireTokenRedirect({ scopes: apiScopes, account });
    }
    return null;
  }
}

export type { AccountInfo };
