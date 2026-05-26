import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTracks, type CatalogTrack } from "@/lib/api";

export const Route = createFileRoute("/catalog")({ component: CatalogPage });

function CatalogPage() {
  const [tracks, setTracks] = useState<CatalogTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
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

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Catalog</h1>
      {loading && <div className="rounded border p-4 text-sm text-muted-foreground">Loading tracks…</div>}
      {error && <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {!loading && !error && tracks.length === 0 && (
        <div className="rounded border p-4 text-sm text-muted-foreground">No tracks found.</div>
      )}
      {!loading && !error && tracks.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3">Title</th><th className="p-3">Artist</th><th className="p-3">Release</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id} className="border-t">
                  <td className="p-3"><Link className="text-primary underline" to="/tracks/$id" params={{ id: track.id }}>{track.title ?? "Untitled"}</Link></td>
                  <td className="p-3">{track.artist_name ?? "—"}</td>
                  <td className="p-3">{track.release_title ?? "—"}</td>
                  <td className="p-3">{track.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
