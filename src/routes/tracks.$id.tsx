import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PreviewPlayer } from "@/components/PreviewPlayer";
import { getTrackById, type CatalogTrack } from "@/lib/api";

export const Route = createFileRoute("/tracks/$id")({ component: TrackDetailPage });

function TrackDetailPage() {
  const { id } = Route.useParams();
  const [track, setTrack] = useState<CatalogTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getTrackById(id);
        if (!cancelled) setTrack(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to load track");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Link to="/catalog" className="text-sm text-primary underline">← Back to catalog</Link>
      {loading && <div className="rounded border p-4 text-sm text-muted-foreground">Loading track…</div>}
      {error && <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {!loading && !error && !track && <div className="rounded border p-4 text-sm text-muted-foreground">Track not found.</div>}
      {!loading && !error && track && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h1 className="text-2xl font-bold">{track.title ?? "Untitled"}</h1>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <p><span className="font-medium">ID:</span> {track.id}</p>
              <p><span className="font-medium">Artist:</span> {String(track.artist_name ?? "—")}</p>
              <p><span className="font-medium">Release:</span> {String(track.release_title ?? "—")}</p>
              <p><span className="font-medium">Status:</span> {String(track.status ?? "—")}</p>
            </div>
          </div>
          <PreviewPlayer trackId={track.id} />
        </div>
      )}
    </div>
  );
}
