import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ??
  env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Session persistence + auto-refresh enabled so social-login sessions survive
// reloads and tokens are refreshed in the background.
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL || "http://localhost:54321",
  SUPABASE_ANON_KEY || "public-anon-key-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "music-catalog.auth",
    },
  },
);
