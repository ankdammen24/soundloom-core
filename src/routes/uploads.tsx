import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { DropZone } from "@/components/uploads/DropZone";
import { Waveform } from "@/components/audio/Waveform";
import { ProcessingTimeline, timelineFromStatus } from "@/components/ProcessingTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { uploadFile } from "@/lib/upload";
import { FileAudio, X, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/uploads")({
  head: () => ({ meta: [{ title: "Uploads – Catalogus Musicus" }] }),
  component: UploadsPage,
});

type QueueItem = {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "finalizing" | "ready" | "failed";
  error?: string;
  assetId?: string;
  controller: AbortController;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function UploadsPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  function patch(id: string, p: Partial<QueueItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }

  async function runOne(item: QueueItem) {
    try {
      patch(item.id, { status: "uploading", progress: 0 });
      const init = await api.initUpload({
        filename: item.file.name,
        contentType: item.file.type || "application/octet-stream",
        size: item.file.size,
      });
      patch(item.id, { assetId: init.assetId });
      await uploadFile(item.file, init, (p) => patch(item.id, { progress: p.pct }), item.controller.signal);
      patch(item.id, { status: "finalizing", progress: 100 });
      await api.completeUpload(init.assetId);
      patch(item.id, { status: "ready" });
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.status} — ${e.message}` : e instanceof Error ? e.message : "Upload failed";
      patch(item.id, { status: "failed", error: msg });
    }
  }

  async function onFiles(files: File[]) {
    const created: QueueItem[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      progress: 0,
      status: "queued",
      controller: new AbortController(),
    }));
    setItems((prev) => [...created, ...prev]);
    // serial uploads
    for (const it of created) {
      await runOne(it);
    }
  }

  function cancel(id: string) {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it && (it.status === "uploading" || it.status === "queued")) it.controller.abort();
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  const totalBytes = items.reduce((sum, i) => sum + i.file.size, 0);
  const uploadedBytes = items.reduce((sum, i) => sum + (i.file.size * i.progress) / 100, 0);
  const overall = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
  const active = items.some((i) => i.status === "uploading" || i.status === "finalizing");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Uploads" description="Drag and drop audio assets — they're uploaded via signed URL to music-catalog-core." />

      <DropZone onFiles={onFiles} />

      {items.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-medium">
              {items.length} file{items.length === 1 ? "" : "s"}{" "}
              <span className="text-muted-foreground">· {formatBytes(totalBytes)}</span>
            </div>
            {active && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{overall}%</span>
                <div className="h-1.5 w-40 overflow-hidden rounded bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${overall}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="divide-y divide-border">
            {items.map((it) => (
              <div key={it.id} className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <FileAudio className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-sm">{it.file.name}</span>
                      <StatusBadge status={it.status} size="sm" />
                    </div>
                    <div className="text-xs text-muted-foreground">{formatBytes(it.file.size)}</div>
                  </div>
                  <button
                    onClick={() => cancel(it.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {(it.status === "uploading" || it.status === "finalizing") && (
                  <div className="h-1 w-full overflow-hidden rounded bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${it.progress}%` }} />
                  </div>
                )}
                <Waveform file={it.file} height={36} buckets={150} />
                {it.status === "failed" && it.error && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
                    <div>{it.error}</div>
                  </div>
                )}
                {it.status === "ready" && (
                  <div className="flex items-start gap-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5" />
                    <div>
                      Asset created — <code className="font-mono">{it.assetId}</code>
                    </div>
                  </div>
                )}
                {(it.status === "uploading" || it.status === "finalizing" || it.status === "ready") && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Processing timeline</summary>
                    <div className="mt-3">
                      <ProcessingTimeline
                        steps={timelineFromStatus(
                          it.status === "ready" ? "ready" : it.status === "finalizing" ? "processing" : "uploaded",
                        )}
                      />
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
