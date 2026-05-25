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
    await msalInstance.loginRedirect(buildLoginRequest(redirect));
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
