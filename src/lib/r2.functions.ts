import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  R2_BUCKETS,
  type R2BucketKind,
  presignPut,
  presignGet,
  headObject,
  publicArtworkUrl,
} from "./r2.server";

const BUCKET_KIND = z.enum(["masters", "previews", "normalized", "artwork", "exports"]);

// Object key builders
export const r2Keys = {
  master: (artistId: string, trackId: string, ext = "wav") => `masters/${artistId}/${trackId}.${ext}`,
  preview: (trackId: string) => `previews/${trackId}.mp3`,
  normalizedRadio: (trackId: string) => `normalized/radio/${trackId}.wav`,
  artworkTrack: (trackId: string, ext = "jpg") => `artwork/tracks/${trackId}.${ext}`,
  exportMetadata: (releaseId: string) => `exports/${releaseId}/metadata.json`,
};

// 1) Presigned upload URL
export const getR2UploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        bucket: BUCKET_KIND,
        key: z.string().min(1).max(1024),
        contentType: z.string().min(1).max(255),
        expiresIn: z.number().int().min(60).max(3600).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const bucket = R2_BUCKETS[data.bucket as R2BucketKind];
    const url = await presignPut(bucket, data.key, data.contentType, data.expiresIn ?? 900);
    return { url, bucket, key: data.key, method: "PUT" as const, expiresIn: data.expiresIn ?? 900 };
  });

// 2) Presigned download/playback URL
export const getR2DownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        bucket: BUCKET_KIND,
        key: z.string().min(1).max(1024),
        expiresIn: z.number().int().min(60).max(3600).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const bucket = R2_BUCKETS[data.bucket as R2BucketKind];
    // artwork can be public via custom domain
    if (data.bucket === "artwork") {
      const pub = publicArtworkUrl(data.key);
      if (pub) return { url: pub, expiresIn: 0, public: true as const };
    }
    const url = await presignGet(bucket, data.key, data.expiresIn ?? 900);
    return { url, expiresIn: data.expiresIn ?? 900, public: false as const };
  });

// 3 + 4 + 6) Upload completion: verify in R2, update tracks row + status
export const completeR2Upload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        bucket: BUCKET_KIND,
        key: z.string().min(1).max(1024),
        trackId: z.string().uuid().optional(),
        releaseId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const bucket = R2_BUCKETS[data.bucket as R2BucketKind];

    // Verify the object actually landed in R2
    let head;
    try {
      head = await headObject(bucket, data.key);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Upload verification failed for ${bucket}/${data.key}: ${msg}`);
    }
    if (!head.contentLength) {
      throw new Error(`Uploaded object is empty: ${bucket}/${data.key}`);
    }

    // Update Supabase metadata for tracks (RLS-scoped to the caller)
    if (data.trackId) {
      const sb = context.supabase;
      const patch: Record<string, unknown> = {};
      switch (data.bucket) {
        case "masters":
          patch.master_file_key = data.key;
          patch.status = "uploaded";
          break;
        case "previews":
          patch.preview_file_key = data.key;
          break;
        case "normalized":
          patch.normalized_file_key = data.key;
          break;
        case "artwork":
          patch.artwork_key = data.key;
          break;
        default:
          break;
      }
      if (Object.keys(patch).length > 0) {
        const { error } = await (sb as unknown as { from: (t: string) => { update: (p: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } } })
          .from("tracks").update(patch).eq("id", data.trackId);
        if (error) throw new Error(`Supabase update failed: ${error.message}`);
      }
    }

    return {
      ok: true as const,
      bucket,
      key: data.key,
      size: head.contentLength,
      contentType: head.contentType,
      etag: head.etag,
    };
  });
