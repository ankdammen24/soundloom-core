import { useCallback } from "react";
import { authClient, type LoginInput, type RegisterInput } from "./client";
import { authStore, useAuthState, type AuthUser } from "./store";
import { tokenStorage } from "./storage";

function applySession(res: { accessToken: string; refreshToken?: string | null; user: AuthUser }) {
  tokenStorage.setAccess(res.accessToken);
  if (res.refreshToken !== undefined) tokenStorage.setRefresh(res.refreshToken ?? null);
  authStore.set({ status: "authenticated", user: res.user, accessToken: res.accessToken });
}

function clearSession() {
  tokenStorage.clear();
  authStore.signOut();
}

export function useAuth() {
  const state = useAuthState();

  const login = useCallback(async (input: LoginInput) => {
    const res = await authClient.login(input);
    applySession(res);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await authClient.register(input);
    applySession(res);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout(tokenStorage.getRefresh());
    clearSession();
  }, []);

  return {
    user: state.user,
    status: state.status,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    login,
    register,
    logout,
  };
}

// Exported for guards / non-component code.
export const authActions = { applySession, clearSession };
