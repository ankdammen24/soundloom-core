import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AuditLogRow = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown>;
};

async function callerHasRole(userId: string, role: "admin" | "editor" | "viewer" | "artist") {
  const { data } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: role });
  return data === true;
}

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(500).default(100),
        action: z.string().max(100).optional(),
        actor_id: z.string().uuid().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const isAdmin = await callerHasRole(context.userId, "admin");
    const isEditor = isAdmin || (await callerHasRole(context.userId, "editor"));
    if (!isEditor) throw new Error("Forbidden: admin or editor required");

    let q = supabaseAdmin
      .from("audit_logs")
      .select("id, created_at, action, entity_type, entity_id, actor_id, metadata")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action) q = q.eq("action", data.action);
    if (data.actor_id) q = q.eq("actor_id", data.actor_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as AuditLogRow[] };
  });

export const recordAuthEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        action: z.enum([
          "login.success",
          "login.failed",
          "logout",
          "access.denied",
          "role.changed",
        ]),
        actor_id: z.string().uuid().nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await supabaseAdmin.rpc("log_audit", {
      _action: data.action,
      _entity_type: "auth",
      _entity_id: null,
      _actor: data.actor_id ?? null,
      _metadata: (data.metadata ?? {}) as never,
    });
    return { ok: true };
  });
