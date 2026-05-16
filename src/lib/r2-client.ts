import { useServerFn } from "@tanstack/react-start";
import { getR2UploadUrl, getR2DownloadUrl, completeR2Upload } from "./r2.functions";

export type R2BucketKind = "masters" | "previews" | "normalized" | "artwork" | "exports";

export function useR2() {
  const upload = useServerFn(getR2UploadUrl);
  const download = useServerFn(getR2DownloadUrl);
  const complete = useServerFn(completeR2Upload);

  async function uploadFile(args: {
    bucket: R2BucketKind;
    key: string;
    file: File;
    trackId?: string;
    onProgress?: (pct: number) => void;
  }) {
    const { url } = await upload({
      data: { bucket: args.bucket, key: args.key, contentType: args.file.type || "application/octet-stream" },
    });

    // PUT directly to R2 with XHR for progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      if (args.file.type) xhr.setRequestHeader("Content-Type", args.file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && args.onProgress) {
          args.onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`R2 upload failed: HTTP ${xhr.status} ${xhr.responseText.slice(0, 200)}`));
      };
      xhr.onerror = () => reject(new Error("Network error during R2 upload."));
      xhr.send(args.file);
    });

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
