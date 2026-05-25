// Re-export the Lovable Cloud-managed Supabase client so the app uses a single
// auth session (the integration client is configured automatically and shared
// with the auth-attacher middleware).

export { supabase } from "@/integrations/supabase/client";

const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
