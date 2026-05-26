import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  authStore,
  bootstrapAuth,
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  useAuthState,
  type AuthUser,
  type AuthStatus,
} from "@/lib/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useAuthState();

  // Boot session once on mount.
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  // Schedule proactive refresh ~60s before expiry.
  useEffect(() => {
    if (state.status !== "authenticated" || !state.expiresAt) return;
    const refreshIn = Math.max(5_000, state.expiresAt - Date.now() - 60_000);
    const t = window.setTimeout(() => {
      void refreshSession();
    }, refreshIn);
    return () => window.clearTimeout(t);
  }, [state.status, state.expiresAt]);

  // Re-validate quietly on window focus when token is close to expiry.
  useEffect(() => {
    const onFocus = () => {
      const s = authStore.getState();
      if (s.status === "authenticated" && s.expiresAt && s.expiresAt - Date.now() < 120_000) {
        void refreshSession();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const login = useCallback((email: string, password: string) => apiLogin(email, password), []);
  const logout = useCallback(() => apiLogout(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading",
      accessToken: state.accessToken,
      login,
      logout,
    }),
    [state.user, state.status, state.accessToken, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
