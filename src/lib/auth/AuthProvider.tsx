import { useEffect, type ReactNode } from "react";
import { setApiTokenGetter } from "@/lib/api";
import { authClient } from "./client";
import { authStore } from "./store";
import { tokenStorage } from "./storage";
import { authActions } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Inject token getter into the central api client.
    setApiTokenGetter(async () => tokenStorage.getAccess());

    let cancelled = false;

    async function bootstrap() {
      const access = tokenStorage.getAccess();
      if (!access) {
        authStore.set({ status: "unauthenticated", user: null, accessToken: null });
        return;
      }
      try {
        const user = await authClient.me();
        if (cancelled) return;
        authStore.set({ status: "authenticated", user, accessToken: access });
      } catch {
        // Try refresh if available.
        const refresh = tokenStorage.getRefresh();
        if (refresh) {
          try {
            const res = await authClient.refresh(refresh);
            if (cancelled) return;
            authActions.applySession(res);
            return;
          } catch {
            /* fall through */
          }
        }
        if (cancelled) return;
        authActions.clearSession();
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
      setApiTokenGetter(null);
    };
  }, []);

  return <>{children}</>;
}
