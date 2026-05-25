// Lovable Cloud Storage backend (replaces former Cloudflare R2 implementation).
// The exported names are kept so existing callers in r2.functions.ts and
// r2-client.ts keep working without churn.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type R2BucketKind = "masters" | "previews" | "normalized" | "artwork" | "exports";

// Bucket "names" are just the bucket ids in Lovable Cloud Storage.
export const R2_BUCKETS: Record<R2BucketKind, string> = {
  masters: "masters",
  previews: "previews",
  normalized: "normalized",
  artwork: "artwork",
  exports: "exports",
};

const PUBLIC_BUCKETS = new Set(["artwork", "previews"]);

export async function presignPut(
  bucket: string,
  key: string,
  _contentType: string,
  expiresIn = 900,
) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(key, { upsert: true });
  if (error || !data)
    throw new Error(`Storage signed upload failed: ${error?.message ?? "unknown"}`);
  // Lovable Cloud signed upload URLs are short-lived; expiresIn is informational.
  void expiresIn;
  return data.signedUrl;
}

export async function presignGet(bucket: string, key: string, expiresIn = 900) {
  if (PUBLIC_BUCKETS.has(bucket)) {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(key);
    return data.publicUrl;
  }
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(key, expiresIn);
  if (error || !data) throw new Error(`Storage signed url failed: ${error?.message ?? "unknown"}`);
  return data.signedUrl;
}

export async function headObject(bucket: string, key: string) {
  // Storage list API gives us metadata for a single object via prefix match.
  const slash = key.lastIndexOf("/");
  const prefix = slash >= 0 ? key.slice(0, slash) : "";
  const name = slash >= 0 ? key.slice(slash + 1) : key;
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(prefix, { search: name, limit: 1 });
  if (error) throw new Error(`Storage head failed: ${error.message}`);
  const obj = data?.find((o) => o.name === name);
  if (!obj) throw new Error(`Object not found: ${bucket}/${key}`);
  const meta = (obj.metadata ?? {}) as { size?: number; mimetype?: string; eTag?: string };
  return {
    contentLength: Number(meta.size ?? 0),
    contentType: meta.mimetype ?? "application/octet-stream",
    etag: meta.eTag ?? null,
  };
}

export function publicArtworkUrl(key: string): string | null {
  const { data } = supabaseAdmin.storage.from("artwork").getPublicUrl(key);
  return data.publicUrl || null;
}
