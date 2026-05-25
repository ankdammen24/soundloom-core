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

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Inject MSAL token getter into the central api client.
    setApiTokenGetter(() => acquireAccessToken());

    let cancelled = false;

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
