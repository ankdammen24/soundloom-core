import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Upload, FileAudio, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/uploads")({
  head: () => ({ meta: [{ title: "Uploads – Catalogus Musicus" }] }),
  component: UploadsPage,
});

type Step = "idle" | "init" | "upload" | "complete" | "done" | "error";

function UploadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<Step>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [assetStatus, setAssetStatus] = useState<string | null>(null);

  const run = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file first");
      setErrMsg(null);
      setProgress(0);
      // 1. init
      setStep("init");
      const init = await api.initUpload({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      setAssetId(init.assetId);

      // 2. upload via signed URL with XHR for progress
      setStep("upload");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(init.method ?? "PUT", init.uploadUrl);
        if (init.headers) for (const [k, v] of Object.entries(init.headers)) xhr.setRequestHeader(k, v);
        if (!init.headers?.["Content-Type"] && !init.headers?.["content-type"]) {
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        }
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      // 3. complete
      setStep("complete");
      const done = await api.completeUpload(init.assetId);
      setAssetStatus(done.status);
      setStep("done");
    },
    onError: (e: unknown) => {
      setStep("error");
      setErrMsg(e instanceof ApiError ? `${e.status} — ${e.message}` : e instanceof Error ? e.message : "Upload failed");
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Uploads" description="Upload audio assets via signed URL to music-catalog-core." />

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <label className="flex items-center gap-3 rounded-md border border-dashed border-input bg-background px-4 py-6 cursor-pointer hover:border-primary/50">
          <FileAudio className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm flex-1">
            <div className="font-medium">{file?.name || "Choose audio file (WAV / FLAC / MP3)"}</div>
            <div className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Max size depends on backend config"}</div>
          </div>
          <input type="file" accept="audio/*" className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setStep("idle"); setProgress(0); setAssetId(null); setAssetStatus(null); }} />
        </label>

        {(step === "upload" || progress > 0) && (
          <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <Btn type="button" disabled={!file || run.isPending} onClick={() => run.mutate()}>
          <Upload className="h-4 w-4" />
          {step === "init" && "Requesting upload URL…"}
          {step === "upload" && `Uploading ${progress}%…`}
          {step === "complete" && "Finalizing…"}
          {(step === "idle" || step === "done" || step === "error") && "Start upload"}
        </Btn>

        <StepList step={step} />

        {step === "done" && (
          <div className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 mt-0.5" />
            <div>
              <div className="font-medium">Upload complete</div>
              <div className="text-xs">assetId: <code className="font-mono">{assetId}</code> · status: <code className="font-mono">{assetStatus}</code></div>
            </div>
          </div>
        )}
        {step === "error" && errMsg && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>{errMsg}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepList({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "init", label: "Request signed upload URL" },
    { id: "upload", label: "Upload bytes to storage" },
    { id: "complete", label: "Finalize asset on backend" },
  ];
  const order: Step[] = ["idle", "init", "upload", "complete", "done"];
  const currIdx = order.indexOf(step === "error" ? "idle" : step);
  return (
    <ol className="space-y-1.5 text-xs">
      {steps.map((s) => {
        const idx = order.indexOf(s.id);
        const status = currIdx > idx ? "done" : currIdx === idx ? "active" : "pending";
        return (
          <li key={s.id} className="flex items-center gap-2 text-muted-foreground">
            {status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            {status === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            {status === "pending" && <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />}
            <span className={status === "done" ? "text-foreground" : ""}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
