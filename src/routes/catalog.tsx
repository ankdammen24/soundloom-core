import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getTracks, type CatalogTrack } from "@/lib/api";
import { Artwork } from "@/components/catalog/Artwork";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalog")({ component: CatalogPage });

function getArtist(t: CatalogTrack) {
  return t.artist_name ?? t.artist ?? "Unknown artist";
}
function getRelease(t: CatalogTrack) {
  return t.release_title ?? t.release ?? null;
}
function getArtwork(t: CatalogTrack) {
  return t.artwork_url ?? t.image_url ?? t.cover_url ?? null;
}

function CatalogPage() {
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTracks();
        if (!cancelled) setTracks(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to load catalog");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tracks) {
      const s = (t.status ?? "unknown").toString();
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return counts;
  }, [tracks]);

  const statusOptions = useMemo(
    () => Array.from(statusCounts.keys()).sort(),
    [statusCounts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter((t) => {
      if (statusFilter !== "all") {
        const s = (t.status ?? "unknown").toString();
        if (s !== statusFilter) return false;
      }
      if (!q) return true;
      return [t.title, getArtist(t), getRelease(t)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [tracks, query, statusFilter]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Soundloom · Catalog
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              Browse the catalog
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {loading
                ? "Loading tracks…"
                : `${filtered.length} of ${tracks.length} track${tracks.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracks, artists, releases"
              className="h-10 w-full rounded-full border border-border/60 bg-card pl-9 pr-4 text-sm outline-none ring-primary/50 placeholder:text-muted-foreground/70 focus:ring-2"
            />
          </div>
        </header>

        {!loading && !error && statusOptions.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <FilterChip
              label={`All (${tracks.length})`}
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
            {statusOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full p-0.5 pr-2 transition focus:outline-none focus:ring-2 focus:ring-primary/50",
                  statusFilter === s
                    ? "ring-2 ring-primary/70"
                    : "opacity-70 hover:opacity-100",
                )}
                aria-pressed={statusFilter === s}
              >
                <StatusBadge status={s} size="sm" />
                <span className="text-[10px] text-muted-foreground">
                  {statusCounts.get(s)}
                </span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && <CatalogGridSkeleton />}

        {!loading && !error && tracks.length === 0 && (
          <EmptyState
            title="Your catalog is empty"
            description="No tracks have been published yet. Once tracks are added through media-catalog they will show up here."
          />
        )}

        {!loading && !error && tracks.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No matches"
            description={
              query
                ? `Nothing matches “${query}”${statusFilter !== "all" ? ` in “${statusFilter.replace(/_/g, " ")}”` : ""}. Try a different search or status.`
                : `No tracks with status “${statusFilter.replace(/_/g, " ")}”.`
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((track) => (
              <li key={track.id}>
                <Link
                  to="/tracks/$id"
                  params={{ id: track.id }}
                  className="group block focus:outline-none"
                >
                  <div className="relative">
                    <Artwork src={getArtwork(track)} alt={track.title ?? ""} />
                    {track.status && (
                      <div className="absolute left-2 top-2">
                        <StatusBadge status={String(track.status)} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="truncate text-sm font-semibold leading-tight group-hover:text-primary">
                      {track.title ?? "Untitled"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{getArtist(track)}</p>
                    {getRelease(track) && (
                      <p className="truncate text-xs text-muted-foreground/70">{getRelease(track)}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CatalogGridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <li key={i}>
          <div className="aspect-square w-full animate-pulse rounded-md bg-muted" />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted/70" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-20 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
