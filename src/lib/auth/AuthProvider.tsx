import { useEffect, type ReactNode } from "react";
import { setApiTokenGetter } from "@/lib/api";
import { authStore } from "./store";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!supabaseConfigured) {
      authStore.set({ status: "unauthenticated", user: null });
      return;
    }

    // Token getter for the API client — always pulls the freshest access token.
    setApiTokenGetter(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });

    // Subscribe FIRST, then hydrate, per Supabase guidance.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authStore.setFromSession(session);
    });

    void supabase.auth.getSession().then(({ data }) => {
      authStore.setFromSession(data.session);
    });

    return () => {
      subscription.unsubscribe();
      setApiTokenGetter(null);
    };
  }, []);

  return <>{children}</>;
}
