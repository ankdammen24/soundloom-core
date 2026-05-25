// Presigned-upload flow against media-catalog.
//
// 1. POST /api/v1/uploads/presign → { url, method, headers?, key, bucket? }
// 2. Browser PUTs the file binary directly to the returned URL (R2)
// 3. Optional: caller stores metadata via the catalog API

import { api } from "./client";

export type PresignKind = "audio" | "artwork" | string;

export type PresignRequest = {
  kind: PresignKind;
  filename: string;
  content_type: string;
  size_bytes: number;
  track_id?: string | null;
  release_id?: string | null;
};

export type PresignResponse = {
  url: string;
  method?: "PUT" | "POST";
  headers?: Record<string, string>;
  key: string;
  bucket?: string;
  // Public URL once the upload completes (for artwork).
  public_url?: string | null;
  // Echo of the upload id the backend assigned, if any.
  upload_id?: string | null;
};

export const uploadsApi = {
  presign: (input: PresignRequest) =>
    api.post<PresignResponse>("/api/v1/uploads/presign", input),
};

/** Upload a file directly to R2 using the presigned URL. Reports progress 0–100. */
export function uploadToPresignedUrl(
  presign: PresignResponse,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(presign.method ?? "PUT", presign.url, true);
    const headers = presign.headers ?? {};
    if (!headers["Content-Type"] && file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
