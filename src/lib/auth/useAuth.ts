import { useCallback } from "react";
import { useAuthState } from "./store";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Provider } from "@supabase/supabase-js";

export type SupportedProvider = "google" | "github" | "azure" | "apple";

export function useAuth() {
  const state = useAuthState();

  const signInWith = useCallback(async (provider: SupportedProvider, redirectTo?: string) => {
    if (!supabaseConfigured) {
      throw new Error("Supabase är inte konfigurerat.");
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirect = `${origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: redirect,
        scopes: provider === "azure" ? "email openid profile" : undefined,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user: state.user,
    status: state.status,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    signInWith,
    signOut,
    // Back-compat aliases used elsewhere in the app
    loginRedirect: (_redirect?: string) => Promise.reject(new Error("Use signInWith(provider).")),
    logoutRedirect: signOut,
    login: (_redirect?: string) => Promise.reject(new Error("Use signInWith(provider).")),
    logout: signOut,
  };
}
