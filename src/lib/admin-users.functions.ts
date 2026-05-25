import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export const APP_ROLES = ["admin", "editor", "artist", "viewer"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type AdminUserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: AppRole[];
};

async function assertCallerIsAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("Forbidden: admin role required");
}

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);

    // List auth users (admin-only operation, bypasses RLS).
    const users: {
      id: string;
      email: string | null;
      created_at: string;
      last_sign_in_at: string | null;
      user_metadata: Record<string, unknown> | null;
    }[] = [];
    let page = 1;
    const perPage = 200;
    // Hard cap to avoid runaway loops on very large projects.
    while (page <= 25) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      for (const u of data.users) {
        users.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          user_metadata: (u.user_metadata as Record<string, unknown> | null) ?? null,
        });
      }
      if (data.users.length < perPage) break;
      page += 1;
    }

    const ids = users.map((u) => u.id);
    let rolesByUser = new Map<string, AppRole[]>();
    if (ids.length > 0) {
      const { data: roleRows, error: rolesErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      if (rolesErr) throw new Error(rolesErr.message);
      rolesByUser = (roleRows ?? []).reduce((acc, r) => {
        const arr = acc.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        acc.set(r.user_id, arr);
        return acc;
      }, new Map<string, AppRole[]>());
    }

    // Pull display names from profiles in one shot.
    const profilesById = new Map<string, string | null>();
    if (ids.length > 0) {
      const { data: profileRows, error: profErr } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      if (profErr) throw new Error(profErr.message);
      for (const p of profileRows ?? []) {
        profilesById.set(p.id, p.display_name ?? null);
      }
    }

    const rows: AdminUserRow[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      display_name:
        profilesById.get(u.id) ??
        (u.user_metadata?.display_name as string | undefined) ??
        (u.user_metadata?.full_name as string | undefined) ??
        (u.user_metadata?.name as string | undefined) ??
        null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      roles: (rolesByUser.get(u.id) ?? []).sort(),
    }));

    rows.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
    return { users: rows };
  });

const mutationSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(APP_ROLES),
});

export const addUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => mutationSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => mutationSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertCallerIsAdmin(context.supabase, context.userId);

    // Don't let admins remove their own last admin role and lock themselves out.
    if (data.user_id === context.userId && data.role === "admin") {
      const { count, error: countErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if (countErr) throw new Error(countErr.message);
      if ((count ?? 0) <= 1) {
        throw new Error("Cannot remove the last admin role from yourself");
      }
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
