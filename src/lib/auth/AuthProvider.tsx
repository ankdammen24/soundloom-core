import { useEffect, type ReactNode } from "react";
import { setApiTokenGetter } from "@/lib/api";
import { authStore } from "./store";
import { getAccessToken, getCurrentUser, connectConfigured } from "@/lib/connectAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    setApiTokenGetter(() => getAccessToken());

    if (!connectConfigured) {
      authStore.set({ status: "unauthenticated", user: null });
      return () => setApiTokenGetter(null);
    }

    const user = getCurrentUser();
    authStore.setFromUser(user);

    // Cross-tab sync: if another tab signs in/out, mirror it here.
    function onStorage(e: StorageEvent) {
      if (e.key === "connect.session") {
        authStore.setFromUser(getCurrentUser());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      setApiTokenGetter(null);
    };
  }, []);

  return <>{children}</>;
}
