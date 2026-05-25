import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

const PROFILE_COLUMNS = "id,email,display_name,avatar_url";

function profileFromAuth(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): ProfileRow {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    display_name:
      (metadata.display_name as string | undefined) ??
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      user.email ??
      null,
    avatar_url:
      (metadata.avatar_url as string | undefined) ??
      (metadata.picture as string | undefined) ??
      null,
  };
}

async function getVerifiedUser(supabase: {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null } | null };
      error: { message: string } | null;
    }>;
  };
}) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error(error?.message ?? "Unauthorized");
  }
  return data.user;
}

export const getOrCreateMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
    const user = await getVerifiedUser(supabase);

    const { data: existing, error: readError } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", context.userId)
      .maybeSingle();

    if (readError) throw new Error(readError.message);
    if (existing) return { profile: existing as ProfileRow, created: false };

    const fallback = profileFromAuth(user);
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .upsert(fallback, { onConflict: "id" })
      .select(PROFILE_COLUMNS)
      .single();

    if (createError) throw new Error(createError.message);
    return { profile: created as ProfileRow, created: true };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        display_name: z.string().trim().max(120).nullable(),
        avatar_url: z.string().trim().max(2048).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const user = await getVerifiedUser(supabase);
    const fallback = profileFromAuth(user);

    const payload = {
      id: context.userId,
      email: fallback.email,
      display_name: data.display_name || null,
      avatar_url: data.avatar_url || null,
    };

    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select(PROFILE_COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return { profile: profile as ProfileRow };
  });