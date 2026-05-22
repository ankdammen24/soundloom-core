import type { UploadInit } from "@/lib/api";

export type UploadProgress = { loaded: number; total: number; pct: number };

export function uploadFile(
  file: File,
  init: UploadInit,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(init.method ?? "PUT", init.uploadUrl);
    if (init.headers) {
      for (const [k, v] of Object.entries(init.headers)) xhr.setRequestHeader(k, v);
    }
    const hasCT =
      init.headers &&
      Object.keys(init.headers).some((k) => k.toLowerCase() === "content-type");
    if (!hasCT) {
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total, pct: Math.round((e.loaded / e.total) * 100) });
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}
