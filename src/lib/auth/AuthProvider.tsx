import { useEffect, type ReactNode } from "react";
import { authStore } from "./store";
import { fetchUserRoles } from "./landing";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let activeRoleRequest = 0;

    if (!supabaseConfigured) {
      authStore.set({ status: "unauthenticated", user: null });
      return;
    }

    const hydrate = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!session?.user) {
        activeRoleRequest += 1;
        authStore.setFromSession(null);
        return;
      }
      authStore.setFromSession(session, []);
      const requestId = activeRoleRequest + 1;
      activeRoleRequest = requestId;
      void fetchUserRoles(session.user.id).then((roles) => {
        if (activeRoleRequest === requestId) authStore.setRoles(roles);
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrate(session);
    });

    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
