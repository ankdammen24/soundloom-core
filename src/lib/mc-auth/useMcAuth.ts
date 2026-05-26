import { useCallback } from "react";
import { useMcAuthState } from "./store";
import { mcLogin, mcLogout } from "./client";

export function useMcAuth() {
  const state = useMcAuthState();

  const login = useCallback((email: string, password: string) => mcLogin(email, password), []);
  const logout = useCallback(() => mcLogout(), []);

  return {
    user: state.user,
    status: state.status,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    accessToken: state.accessToken,
    login,
    logout,
  };
}
