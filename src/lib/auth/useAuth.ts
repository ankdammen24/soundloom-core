import { useCallback } from "react";
import { useAuthState } from "./store";
import { redirectToLogin, logout as connectLogout, connectConfigured } from "@/lib/connectAuth";

export function useAuth() {
  const state = useAuthState();

  const loginRedirect = useCallback(async (redirect?: string) => {
    if (!connectConfigured) {
      throw new Error("Connect is not configured. Set VITE_CONNECT_BASE_URL, VITE_CONNECT_CLIENT_ID, VITE_CONNECT_REDIRECT_URI.");
    }
    await redirectToLogin(redirect);
  }, []);

  const logoutRedirect = useCallback(async () => {
    connectLogout();
  }, []);

  return {
    user: state.user,
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
