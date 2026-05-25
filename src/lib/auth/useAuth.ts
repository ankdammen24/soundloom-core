import { useCallback } from "react";
import { useAuthState } from "./store";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable";

export type SupportedProvider = "google";

function callbackUrl(redirectTo?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;
}

export function useAuth() {
  const state = useAuthState();

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabaseConfigured) throw new Error("Backend är inte konfigurerat.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!supabaseConfigured) throw new Error("Backend är inte konfigurerat.");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: displayName ? { display_name: displayName } : undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    [],
  );

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    if (!supabaseConfigured) throw new Error("Backend är inte konfigurerat.");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: callbackUrl(redirectTo),
    });
    if (result.error) throw result.error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Back-compat shim for older callers.
  const signInWith = useCallback(
    async (provider: SupportedProvider, redirectTo?: string) => {
      if (provider === "google") return signInWithGoogle(redirectTo);
      throw new Error(`Provider ${provider} stöds inte längre.`);
    },
    [signInWithGoogle],
  );

  return {
    user: state.user,
    status: state.status,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWith,
    signOut,
    loginRedirect: (_redirect?: string) =>
      Promise.reject(new Error("Use signInWithEmail or signInWithGoogle.")),
    logoutRedirect: signOut,
    login: (_redirect?: string) =>
      Promise.reject(new Error("Use signInWithEmail or signInWithGoogle.")),
    logout: signOut,
  };
}
