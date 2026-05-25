import { useEffect, type ReactNode } from "react";
import { setApiTokenGetter } from "@/lib/api";
import { authStore } from "./store";
import {
  initMsal,
  msalInstance,
  getActiveAccount,
  acquireAccessToken,
  msalConfigured,
} from "./msal";
import { fetchMe, authApiConfigured } from "./connect";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    setApiTokenGetter(() => acquireAccessToken());

    let cancelled = false;

    async function hydrateProfile() {
      if (!authApiConfigured) return;
      const token = await acquireAccessToken();
      if (!token || cancelled) return;
      try {
        const me = await fetchMe(token);
        if (!me || cancelled) return;
        const current = authStore.getState();
        if (current.status !== "authenticated") return;
        authStore.set({
          user: {
            ...(current.user ?? {}),
            id: me.id ?? me.sub ?? current.user?.id ?? "",
            email: me.email ?? current.user?.email,
            name: me.name ?? me.displayName ?? current.user?.name,
            displayName: me.displayName ?? me.name ?? current.user?.displayName,
            avatarUrl: me.avatarUrl ?? current.user?.avatarUrl,
            roles: me.roles,
          },
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[auth] profile hydration failed", e);
      }
    }

    async function bootstrap() {
      if (!msalConfigured) {
        authStore.set({ status: "unauthenticated", user: null, account: null });
        return;
      }
      try {
        await initMsal();
        const redirectResult = await msalInstance.handleRedirectPromise();
        if (cancelled) return;

        if (redirectResult?.account) {
          msalInstance.setActiveAccount(redirectResult.account);
        } else {
          const existing = getActiveAccount();
          if (existing) msalInstance.setActiveAccount(existing);
        }

        const account = getActiveAccount();
        authStore.setFromAccount(account);
        if (account) void hydrateProfile();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[auth] MSAL bootstrap failed", e);
        if (!cancelled) authStore.set({ status: "unauthenticated", user: null, account: null });
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
