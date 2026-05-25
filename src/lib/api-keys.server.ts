// Server-only helpers for validating incoming API keys on public HTTP routes.
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ApiKeyValidation =
  | { ok: true; key_id: string; scopes: string[] }
  | { ok: false; status: 401 | 403; reason: string };

export function extractApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth) {
    const m = auth.match(/^Bearer\s+(\S+)$/i);
    if (m) return m[1];
  }
  const x = request.headers.get("x-api-key");
  return x ? x.trim() : null;
}

export async function validateApiKey(
  request: Request,
  requiredScope: string,
): Promise<ApiKeyValidation> {
  const raw = extractApiKey(request);
  if (!raw) {
    await writeDenied(null, "missing_credentials", requiredScope);
    return { ok: false, status: 401, reason: "missing_credentials" };
  }
  if (!/^mrq_(live|test)_[A-Za-z0-9]{8,}$/.test(raw)) {
    await writeDenied(null, "malformed", requiredScope);
    return { ok: false, status: 401, reason: "malformed" };
  }
  const hash = createHash("sha256").update(raw).digest("hex");
  const { data, error } = await supabaseAdmin.rpc("validate_api_key", {
    _hash: hash,
    _required_scope: requiredScope,
  });
  if (error) {
    return { ok: false, status: 401, reason: "validation_failed" };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.ok) {
    const reason = row?.reason ?? "invalid";
    await writeDenied(row?.key_id ?? null, reason, requiredScope);
    const status: 401 | 403 = reason === "scope_denied" ? 403 : 401;
    return { ok: false, status, reason };
  }
  return { ok: true, key_id: row.key_id, scopes: row.scopes ?? [] };
}

async function writeDenied(
  keyId: string | null,
  reason: string,
  requiredScope: string,
) {
  try {
    await supabaseAdmin.rpc("log_audit", {
      _action: "api_key.denied",
      _entity_type: "api_key",
      _entity_id: keyId,
      _actor: null,
      _metadata: { reason, required_scope: requiredScope } as never,
    });
  } catch {
    // best-effort
  }
}
