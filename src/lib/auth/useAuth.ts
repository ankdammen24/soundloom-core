import { useCallback } from "react";
import { useAuthState } from "./store";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable";

export type SupportedProvider = "google" | "apple";

function safeRedirectTarget(redirectTo?: string) {
  if (!redirectTo) return "";
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) return "";
  if (redirectTo.startsWith("/auth/callback")) return "";
  return redirectTo;
}

// IMPORTANT: redirect callbacks land on the site root ("/"), not on
// "/auth/callback". Some custom-domain edges return 404 for deep links on
// initial GET, so the token hash must arrive at a path the edge always serves.
// The root route detects the hash tokens and forwards to the intended target
// client-side via router navigation. See src/routes/index.tsx.
function callbackUrl(redirectTo?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const safe = safeRedirectTarget(redirectTo) || "/profile";
  return `${origin}/?next=${encodeURIComponent(safe)}`;
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

  const signInWithApple = useCallback(async (redirectTo?: string) => {
    if (!supabaseConfigured) throw new Error("Backend är inte konfigurerat.");
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: callbackUrl(redirectTo),
    });
    if (result.error) throw result.error;
  }, []);

  const signInWithSSO = useCallback(async (email: string, redirectTo?: string) => {
    if (!supabaseConfigured) throw new Error("Backend är inte konfigurerat.");
    const domain = email.split("@")[1]?.trim().toLowerCase();
    if (!domain) throw new Error("Ange en giltig e-postadress.");
    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
      options: { redirectTo: callbackUrl(redirectTo) },
    });
    if (error) throw error;
    if (data?.url && typeof window !== "undefined") {
      window.location.href = data.url;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Back-compat shim for older callers.
  const signInWith = useCallback(
    async (provider: SupportedProvider, redirectTo?: string) => {
      if (provider === "google") return signInWithGoogle(redirectTo);
      if (provider === "apple") return signInWithApple(redirectTo);
      throw new Error(`Provider ${provider} stöds inte längre.`);
    },
    [signInWithGoogle, signInWithApple],
  );

  return {
    user: state.user,
    status: state.status,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signInWithSSO,
    signInWith,
    signOut,
    loginRedirect: (_redirect?: string) =>
      Promise.reject(new Error("Use signInWithEmail, signInWithGoogle or signInWithApple.")),
    logoutRedirect: signOut,
    login: (_redirect?: string) =>
      Promise.reject(new Error("Use signInWithEmail, signInWithGoogle or signInWithApple.")),
    logout: signOut,
  };
}
