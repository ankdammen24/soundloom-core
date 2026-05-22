import { cn } from "@/lib/utils";
import type { RightsStatus, TrackStatus, AlbumStatus, ReleaseStatus, DistributionStatus, JobStatus } from "@/lib/types";
import { CheckCircle2, Clock, AlertTriangle, Loader2, Circle, XCircle } from "lucide-react";
import type { ComponentType } from "react";

type AnyStatus = TrackStatus | RightsStatus | AlbumStatus | ReleaseStatus | DistributionStatus | JobStatus | string;

const styles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  uploaded: "bg-info/15 text-info",
  uploading: "bg-info/15 text-info",
  finalizing: "bg-info/15 text-info",
  processing: "bg-info/15 text-info",
  needs_metadata: "bg-warning/15 text-warning-foreground",
  needs_rights_check: "bg-warning/15 text-warning-foreground",
  approved: "bg-success/15 text-success",
  ready: "bg-success/15 text-success",
  published: "bg-success/20 text-success",
  distributed: "bg-primary/15 text-primary",
  archived: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
  incomplete: "bg-warning/15 text-warning-foreground",
  cleared: "bg-success/15 text-success",
  blocked: "bg-destructive/15 text-destructive",
  scheduled: "bg-info/15 text-info",
  released: "bg-success/15 text-success",
  live: "bg-success/15 text-success",
  takedown: "bg-destructive/15 text-destructive",
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-info/15 text-info",
  delivered: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  error: "bg-destructive/15 text-destructive",
  queued: "bg-muted text-muted-foreground",
  running: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  online: "bg-success/15 text-success",
  offline: "bg-muted text-muted-foreground",
  degraded: "bg-warning/15 text-warning-foreground",
};

const icons: Record<string, ComponentType<{ className?: string }>> = {
  approved: CheckCircle2,
  ready: CheckCircle2,
  published: CheckCircle2,
  released: CheckCircle2,
  delivered: CheckCircle2,
  success: CheckCircle2,
  cleared: CheckCircle2,
  live: CheckCircle2,
  online: CheckCircle2,
  pending: Clock,
  scheduled: Clock,
  queued: Clock,
  draft: Circle,
  processing: Loader2,
  uploading: Loader2,
  finalizing: Loader2,
  running: Loader2,
  in_progress: Loader2,
  needs_metadata: AlertTriangle,
  needs_rights_check: AlertTriangle,
  incomplete: AlertTriangle,
  degraded: AlertTriangle,
  failed: XCircle,
  error: XCircle,
  blocked: XCircle,
  takedown: XCircle,
};

const activeStatuses = new Set(["processing", "uploading", "finalizing", "running", "in_progress"]);

export function StatusBadge({
  status,
  className,
  size = "md",
  withIcon = true,
  pulse,
}: {
  status: AnyStatus;
  className?: string;
  size?: "sm" | "md";
  withIcon?: boolean;
  pulse?: boolean;
}) {
  const label = status.replace(/_/g, " ");
  const Icon = icons[status];
  const isActive = activeStatuses.has(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium ring-1 ring-inset ring-border/50 capitalize whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
        styles[status] ?? "bg-muted text-muted-foreground",
        (pulse ?? isActive) && "relative",
        className,
      )}
    >
      {(pulse ?? isActive) && (
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-current animate-ping opacity-60" />
      )}
      {withIcon && Icon && (
        <Icon className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3", isActive && "animate-spin")} />
      )}
      {label}
    </span>
  );
}
