import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Reads any of the common Supabase env var names so this connects to your
// existing project without changes:
//   VITE_SUPABASE_URL                 + VITE_SUPABASE_ANON_KEY
//   VITE_SUPABASE_URL                 + VITE_SUPABASE_PUBLISHABLE_KEY
//   NEXT_PUBLIC_SUPABASE_URL          + NEXT_PUBLIC_SUPABASE_ANON_KEY
const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ??
  env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// When env is missing we still export a stub client so imports don't crash;
// hooks check `supabaseConfigured` and surface a setup banner instead.
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL || "http://localhost:54321",
  SUPABASE_ANON_KEY || "public-anon-key-placeholder",
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
