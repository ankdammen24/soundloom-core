import { cn } from "@/lib/utils";
import type { RightsStatus, TrackStatus, AlbumStatus, ReleaseStatus, DistributionStatus, JobStatus } from "@/lib/types";

type AnyStatus = TrackStatus | RightsStatus | AlbumStatus | ReleaseStatus | DistributionStatus | JobStatus | string;

const styles: Record<string, string> = {
  // track
  draft: "bg-muted text-muted-foreground",
  uploaded: "bg-info/15 text-info",
  processing: "bg-info/15 text-info",
  needs_metadata: "bg-warning/15 text-warning-foreground",
  needs_rights_check: "bg-warning/15 text-warning-foreground",
  approved: "bg-success/15 text-success",
  published: "bg-success/20 text-success",
  distributed: "bg-primary/15 text-primary",
  archived: "bg-muted text-muted-foreground",
  // rights
  unknown: "bg-muted text-muted-foreground",
  incomplete: "bg-warning/15 text-warning-foreground",
  cleared: "bg-success/15 text-success",
  blocked: "bg-destructive/15 text-destructive",
  // album / release
  scheduled: "bg-info/15 text-info",
  released: "bg-success/15 text-success",
  live: "bg-success/15 text-success",
  takedown: "bg-destructive/15 text-destructive",
  // distribution
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-info/15 text-info",
  delivered: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  // jobs
  queued: "bg-muted text-muted-foreground",
  running: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
};

export function StatusBadge({ status, className }: { status: AnyStatus; className?: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-border/50 capitalize whitespace-nowrap",
        styles[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
