import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PreviewPlayer } from "@/components/PreviewPlayer";
import { Artwork } from "@/components/catalog/Artwork";
import { getTrackById, type CatalogTrack } from "@/lib/api";

export const Route = createFileRoute("/tracks/$id")({ component: TrackDetailPage });

function formatDuration(seconds?: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getArtist(t: CatalogTrack) {
  return t.artist_name ?? t.artist ?? "Unknown artist";
}
function getRelease(t: CatalogTrack) {
  return t.release_title ?? t.release ?? null;
}
function getArtwork(t: CatalogTrack) {
  return t.artwork_url ?? t.image_url ?? t.cover_url ?? null;
}

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
        setError(null);
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

  const duration = track ? formatDuration(track.duration_seconds ?? track.duration) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to catalog
        </Link>

        {loading && (
          <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">
            <div className="aspect-square w-full animate-pulse rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted/70" />
              <div className="h-20 w-full animate-pulse rounded bg-muted/50" />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && !track && (
          <div className="mt-8 rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-20 text-center">
            <h2 className="text-lg font-semibold">Track not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The track you’re looking for does not exist or is not available.
            </p>
          </div>
        )}

        {!loading && !error && track && (
          <article className="mt-8 space-y-8">
            <header className="grid gap-8 md:grid-cols-[260px_1fr] md:items-end">
              <Artwork src={getArtwork(track)} alt={track.title ?? ""} className="rounded-xl shadow-lg" />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Track
                </p>
                <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                  {track.title ?? "Untitled"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  <span className="font-medium text-foreground">{getArtist(track)}</span>
                  {getRelease(track) && <> · {getRelease(track)}</>}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {track.status && <Pill>{String(track.status)}</Pill>}
                  {track.genre && <Pill>{String(track.genre)}</Pill>}
                  {duration && <Pill>{duration}</Pill>}
                  {track.isrc && <Pill>ISRC {track.isrc}</Pill>}
                </div>
              </div>
            </header>

            <section>
              <PreviewPlayer trackId={track.id} />
            </section>

            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Metadata
              </h2>
              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <Meta label="Track ID" value={track.id} mono />
                <Meta label="Artist" value={getArtist(track)} />
                <Meta label="Release" value={getRelease(track) ?? "—"} />
                <Meta label="Status" value={track.status ?? "—"} />
                {track.isrc && <Meta label="ISRC" value={track.isrc} mono />}
                {track.genre && <Meta label="Genre" value={track.genre} />}
                {duration && <Meta label="Duration" value={duration} />}
              </dl>
            </section>
          </article>
        )}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function Meta({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`mt-1 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
