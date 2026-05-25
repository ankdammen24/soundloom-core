import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getR2DownloadUrl, completeR2Upload } from "./r2.functions";

export type R2BucketKind = "masters" | "previews" | "normalized" | "artwork" | "exports";

export function useR2() {
  const download = useServerFn(getR2DownloadUrl);
  const complete = useServerFn(completeR2Upload);

  async function uploadFile(args: {
    bucket: R2BucketKind;
    key: string;
    file: File;
    trackId?: string;
    onProgress?: (pct: number) => void;
  }) {
    // Upload directly to Lovable Cloud Storage using the authenticated client.
    // RLS policies on storage.objects gate access.
    const { error } = await supabase.storage
      .from(args.bucket)
      .upload(args.key, args.file, {
        upsert: true,
        contentType: args.file.type || "application/octet-stream",
      });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    // Progress reporting isn't exposed by supabase-js; emit a final tick.
    args.onProgress?.(100);

    const result = await complete({
      data: { bucket: args.bucket, key: args.key, trackId: args.trackId },
    });
    return result;
  }

  async function getPlaybackUrl(bucket: R2BucketKind, key: string) {
    const r = await download({ data: { bucket, key } });
    return r.url;
  }

  return { uploadFile, getPlaybackUrl };
}
