import { useCallback } from "react";
import { useAuthState } from "./store";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { lovable } from "@/integrations/lovable";

function safeRedirectTarget(redirectTo?: string) {
  if (!redirectTo) return "";
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) return "";
  if (redirectTo.startsWith("/auth/callback")) return "";
  return redirectTo;
}

function callbackUrl(redirectTo?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const safe = safeRedirectTarget(redirectTo) || "/dashboard";
  return `${origin}/auth/callback?next=${encodeURIComponent(safe)}`;
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
          emailRedirectTo: `${origin}/auth/callback?next=%2Fdashboard`,
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


  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const signInWith = useCallback(
    async (provider: "google" | "apple", redirectTo?: string) => {
      if (provider === "google") return signInWithGoogle(redirectTo);
      if (provider === "apple") return signInWithApple(redirectTo);
      throw new Error(`Provider ${provider} stöds inte.`);
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
    loginRedirect: signOut,
    logoutRedirect: signOut,
    login: signOut,
    logout: signOut,
  };
}
