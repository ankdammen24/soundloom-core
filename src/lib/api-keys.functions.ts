import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHash, randomBytes } from "crypto";

export const API_SCOPES = [
  "catalog:read",
  "catalog:write",
  "files:read",
  "files:write",
  "admin",
] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  environment: "live" | "test";
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
};

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("Forbidden: admin role required");
}

function base62(bytes: Uint8Array): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (const b of bytes) out += alphabet[b % 62];
  return out;
}

function generateRawKey(env: "live" | "test"): string {
  const random = base62(new Uint8Array(randomBytes(32)));
  return `mrq_${env}_${random}`;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export const listApiKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("api_keys_public")
      .select(
        "id, name, prefix, scopes, environment, created_by, created_by_email, created_at, last_used_at, expires_at, revoked_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { keys: (data ?? []) as ApiKeyRow[] };
  });

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        environment: z.enum(["live", "test"]),
        scopes: z.array(z.enum(API_SCOPES)).min(1).max(API_SCOPES.length),
        expires_at: z.string().datetime().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const raw = generateRawKey(data.environment);
    const key_hash = sha256Hex(raw);
    // Prefix shown in UI: e.g. "mrq_live_xxxxxxxx" — first 16 chars.
    const prefix = raw.slice(0, 16);

    const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const creatorEmail = userInfo.user?.email ?? null;

    const { data: inserted, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        name: data.name,
        prefix,
        key_hash,
        scopes: data.scopes,
        environment: data.environment,
        expires_at: data.expires_at ?? null,
        created_by: context.userId,
        created_by_email: creatorEmail,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.rpc("log_audit", {
      _action: "api_key.created",
      _entity_type: "api_key",
      _entity_id: inserted!.id,
      _actor: context.userId,
      _metadata: {
        name: data.name,
        environment: data.environment,
        scopes: data.scopes,
        prefix,
      } as never,
    });

    return { id: inserted!.id, plaintext: raw, prefix };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .is("revoked_at", null);
    if (error) throw new Error(error.message);

    await supabaseAdmin.rpc("log_audit", {
      _action: "api_key.revoked",
      _entity_type: "api_key",
      _entity_id: data.id,
      _actor: context.userId,
      _metadata: {} as never,
    });

    return { ok: true };
  });
