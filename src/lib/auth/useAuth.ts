import { useCallback } from "react";
import { authStore, useAuthState } from "./store";
import {
  msalInstance,
  initMsal,
  buildLoginRequest,
  getActiveAccount,
  msalConfigured,
} from "./msal";

export function useAuth() {
  const state = useAuthState();

  const loginRedirect = useCallback(async (redirect?: string) => {
    if (!msalConfigured) {
      throw new Error("Entra/MSAL is not configured. Set VITE_ENTRA_CLIENT_ID / AUTHORITY / AUDIENCE.");
    }
    await initMsal();
    const req = buildLoginRequest(redirect);
    // Popup works inside iframes (Lovable preview) and as a normal window.
    // Fall back to redirect only if popup is unavailable (rare, non-iframe).
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    try {
      const result = await msalInstance.loginPopup(req);
      if (result?.account) {
        msalInstance.setActiveAccount(result.account);
        authStore.setFromAccount(result.account);
      }
      if (redirect && typeof window !== "undefined") {
        window.location.assign(redirect);
      }
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      // If popup was blocked and we're NOT in an iframe, fall back to redirect.
      if (!inIframe && /popup_window_error|popup.*blocked|user_cancelled/i.test(msg) === false) {
        await msalInstance.loginRedirect(req);
        return;
      }
      throw e;
    }
  }, []);

  const logoutRedirect = useCallback(async () => {
    await initMsal();
    const account = getActiveAccount();
    authStore.signOut();
    await msalInstance.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri: typeof window !== "undefined" ? window.location.origin : "/",
    });
  }, []);

  return {
    user: state.user,
    account: state.account,
    status: state.status,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    loginRedirect,
    logoutRedirect,
    // Back-compat aliases
    login: loginRedirect,
    logout: logoutRedirect,
  };
}
