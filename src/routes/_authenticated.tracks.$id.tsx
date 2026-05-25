import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError, type Track } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Waveform } from "@/components/audio/Waveform";
import { EditableField } from "@/components/EditableField";
import { StatusBadge } from "@/components/StatusBadge";
import { ProcessingTimeline, timelineFromStatus } from "@/components/ProcessingTimeline";
import { DetailSkeleton } from "@/components/Skeleton";
import { useOptimisticPatch } from "@/hooks/useOptimisticList";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tracks/$id")({
  head: () => ({ meta: [{ title: "Track – Catalogus Musicus" }] }),
  component: TrackDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-destructive">{error.message}</p>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => { router.invalidate(); reset(); }}>Retry</button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-4 text-sm">Track not found.</div>,
});

function TrackDetail() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["tracks", id], queryFn: () => api.getTrack(id), retry: false });
  const patch = useOptimisticPatch<Track>(["tracks"], ["tracks", id], (body) => api.updateTrack(id, body));

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Link to="/tracks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Tracks
        </Link>
        <DetailSkeleton />
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="space-y-4">
        <Link to="/tracks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Tracks
        </Link>
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      </div>
    );
  }
  if (!q.data) return null;
  const t = q.data;
  const audioUrl = t.audioUrl ?? t.previewUrl;

  return (
    <div className="space-y-6">
      <Link to="/tracks" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Tracks
      </Link>
      <PageHeader
        title={t.title}
        description={t.status ? undefined : "Track detail"}
        actions={t.status ? <StatusBadge status={t.status} /> : null}
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <Waveform url={audioUrl} height={80} buckets={400} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
        <EditableField label="Title" value={t.title} onSave={(v) => patch.mutateAsync({ title: v })} />
        <EditableField label="ISRC" value={t.isrc} monospace placeholder="SE-XXX-25-00001" onSave={(v) => patch.mutateAsync({ isrc: v })} />
        <EditableField label="Duration (s)" type="number" value={t.durationSec} onSave={(v) => patch.mutateAsync({ durationSec: Number(v) })} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Processing</h2>
        <div className="max-w-md">
          <ProcessingTimeline steps={timelineFromStatus(t.status)} />
        </div>
      </section>
    </div>
  );
}
