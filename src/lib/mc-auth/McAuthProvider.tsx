import { useEffect, type ReactNode } from "react";
import { mcAuthStore, useMcAuthState } from "./store";
import { mcBootstrap, mcRefresh } from "./client";

/**
 * Mounts the media-catalog auth lifecycle:
 *   1. On boot, attempt a token refresh to restore a session.
 *   2. Schedule a proactive refresh ~60s before the access token expires.
 */
export function McAuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void mcBootstrap();
  }, []);

  // Subscribe so we can re-schedule whenever the token changes.
  const { expiresAt, status } = useMcAuthState();
  useEffect(() => {
    if (status !== "authenticated" || !expiresAt) return;
    const refreshIn = Math.max(5_000, expiresAt - Date.now() - 60_000);
    const timer = window.setTimeout(() => {
      void mcRefresh();
    }, refreshIn);
    return () => window.clearTimeout(timer);
  }, [expiresAt, status]);

  // Re-validate on window focus (silently).
  useEffect(() => {
    const onFocus = () => {
      const s = mcAuthStore.getState();
      if (s.status === "authenticated" && s.expiresAt && s.expiresAt - Date.now() < 120_000) {
        void mcRefresh();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return <>{children}</>;
}
