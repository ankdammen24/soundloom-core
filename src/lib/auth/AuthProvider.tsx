import { useEffect, type ReactNode } from "react";
import { setApiTokenGetter } from "@/lib/api";
import { authStore } from "./store";
import { supabase, supabaseConfigured } from "@/lib/supabase";

async function fetchRoles(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) return [];
    return (data ?? []).map((r) => String((r as { role: string }).role));
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!supabaseConfigured) {
      authStore.set({ status: "unauthenticated", user: null });
      return;
    }

    setApiTokenGetter(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });

    const hydrate = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      if (!session?.user) {
        authStore.setFromSession(null);
        return;
      }
      authStore.setFromSession(session, []);
      // Defer role fetch so UI renders immediately, then patch roles in.
      const roles = await fetchRoles(session.user.id);
      authStore.setRoles(roles);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrate(session);
    });

    void supabase.auth.getSession().then(({ data }) => void hydrate(data.session));

    return () => {
      subscription.unsubscribe();
      setApiTokenGetter(null);
    };
  }, []);

  return <>{children}</>;
}
