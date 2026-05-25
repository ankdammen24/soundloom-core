import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, type Release } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Artwork } from "@/components/media/Artwork";
import { StatusBadge } from "@/components/StatusBadge";
import { EditableField } from "@/components/EditableField";
import { ProcessingTimeline, timelineFromStatus } from "@/components/ProcessingTimeline";
import { DetailSkeleton } from "@/components/Skeleton";
import { useOptimisticPatch } from "@/hooks/useOptimisticList";
import { ArrowLeft, AlertTriangle, Radio, ExternalLink } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/releases/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Release – Catalogus Musicus" },
      { property: "og:url", content: `https://catalogusmusicus.mediarosenqvist.com/releases/${params.id}` },
    ],
  }),
  component: ReleaseDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-destructive">{error.message}</p>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => { router.invalidate(); reset(); }}>Retry</button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-4 text-sm">Release not found.</div>,
});

type Tab = "overview" | "tracks" | "processing" | "distribution";

function ReleaseDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["releases", id], queryFn: () => api.getRelease(id), retry: false });
  const tracks = useQuery({ queryKey: ["tracks"], queryFn: api.listTracks, retry: false });
  const [tab, setTab] = useState<Tab>("overview");

  const patch = useOptimisticPatch<Release>(
    ["releases"],
    ["releases", id],
    (body) => api.updateRelease(id, body),
  );

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Link to="/releases" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Releases
        </Link>
        <DetailSkeleton />
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="space-y-4">
        <Link to="/releases" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Releases
        </Link>
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      </div>
    );
  }
  if (!q.data) return null;

  const release = q.data;
  const releaseTracks = (tracks.data ?? []).filter((t) => (t.releaseId ?? t.release_id) === release.id);
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "tracks", label: `Tracks (${releaseTracks.length})` },
    { id: "processing", label: "Processing" },
    { id: "distribution", label: "Distribution" },
  ];

  async function savePatch(body: Partial<Release>) {
    try {
      await patch.mutateAsync(body);
    } catch (e) {
      qc.invalidateQueries({ queryKey: ["releases", id] });
      throw e;
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/releases" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Releases
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <Artwork src={release.coverUrl} seed={release.id + release.title} size="xl" alt={release.title} />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>{release.type ?? "release"}</span>
            {release.status && <StatusBadge status={release.status} size="sm" />}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{release.title}</h1>
          <p className="text-sm text-muted-foreground">
            {release.releaseDate ? `Released ${release.releaseDate}` : "No release date set"}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Radio className="h-4 w-4" /> Distribute
            </button>
            <Link
              to="/distribution"
              className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" /> View distribution
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors " +
                (tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
          <EditableField label="Title" value={release.title} onSave={(v) => savePatch({ title: v })} />
          <EditableField
            label="Type"
            type="select"
            options={[
              { value: "single", label: "Single" },
              { value: "ep", label: "EP" },
              { value: "album", label: "Album" },
            ]}
            value={release.type}
            onSave={(v) => savePatch({ type: v })}
          />
          <EditableField label="Release date" type="date" value={release.releaseDate} onSave={(v) => savePatch({ releaseDate: v })} />
          <EditableField label="Status" value={release.status} onSave={(v) => savePatch({ status: v })} />
        </div>
      )}

      {tab === "tracks" && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {releaseTracks.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No tracks on this release yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Title</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">ISRC</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {releaseTracks.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <Link to="/tracks/$id" params={{ id: t.id }} className="hover:underline font-medium">{t.title}</Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground font-mono text-xs hidden md:table-cell">{t.isrc ?? "—"}</td>
                    <td className="px-4 py-2">{t.status && <StatusBadge status={t.status} size="sm" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "processing" && (
        <div className="max-w-md">
          <ProcessingTimeline steps={timelineFromStatus(release.status)} />
        </div>
      )}

      {tab === "distribution" && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Distribution panel coming soon.
        </div>
      )}
    </div>
  );
}
