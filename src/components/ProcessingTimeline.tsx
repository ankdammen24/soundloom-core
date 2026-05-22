import { CheckCircle2, Loader2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "failed" | "skipped";
  ts?: string;
  error?: string;
};

export function ProcessingTimeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-3 border-l border-border pl-5", className)}>
      {steps.map((s) => {
        const Icon =
          s.status === "done"
            ? CheckCircle2
            : s.status === "active"
              ? Loader2
              : s.status === "failed"
                ? AlertTriangle
                : Circle;
        const color =
          s.status === "done"
            ? "text-success"
            : s.status === "active"
              ? "text-info"
              : s.status === "failed"
                ? "text-destructive"
                : "text-muted-foreground/50";
        return (
          <li key={s.id} className="relative">
            <span
              className={cn(
                "absolute -left-[27px] grid h-4 w-4 place-items-center rounded-full bg-background ring-2 ring-border",
                s.status === "done" && "ring-success/40 bg-success/10",
                s.status === "active" && "ring-info/40 bg-info/10",
                s.status === "failed" && "ring-destructive/40 bg-destructive/10",
              )}
            >
              <Icon className={cn("h-3 w-3", color, s.status === "active" && "animate-spin")} />
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  "text-sm",
                  s.status === "pending" ? "text-muted-foreground" : "font-medium text-foreground",
                )}
              >
                {s.label}
              </span>
              {s.ts && <span className="text-[11px] text-muted-foreground">{s.ts}</span>}
            </div>
            {s.error && <div className="mt-0.5 text-xs text-destructive">{s.error}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export function timelineFromStatus(status?: string): TimelineStep[] {
  const seq = ["uploaded", "probed", "transcoded", "waveform", "tagged", "ready"];
  const labels: Record<string, string> = {
    uploaded: "Uploaded",
    probed: "Probed (ffprobe)",
    transcoded: "Transcoded",
    waveform: "Waveform generated",
    tagged: "Tagged",
    ready: "Ready",
  };
  const s = (status ?? "").toLowerCase();
  let cur = 0;
  if (s.includes("processing")) cur = 1;
  else if (s.includes("transcod")) cur = 2;
  else if (s.includes("waveform")) cur = 3;
  else if (s.includes("tag")) cur = 4;
  else if (s.includes("ready") || s.includes("approved") || s.includes("published") || s.includes("distributed")) cur = 6;
  else if (s.includes("failed") || s.includes("error")) cur = -1;

  return seq.map((id, i) => ({
    id,
    label: labels[id],
    status:
      cur === -1
        ? i === 0
          ? "failed"
          : "pending"
        : i < cur
          ? "done"
          : i === cur
            ? "active"
            : "pending",
  }));
}
