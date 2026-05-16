import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { SetupBanner } from "@/components/Setup";
import { useArtists, useTracks, useAlbums, queryKeys } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import { Plus, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/artists")({
  head: () => ({ meta: [{ title: "Artists – Music Catalog Core" }] }),
  component: ArtistsPage,
});

function ArtistsPage() {
  const [q, setQ] = useState("");
  const artists = useArtists();
  const tracks = useTracks();
  const albums = useAlbums();

  const rows = useMemo(
    () => (artists.data ?? []).filter((a) => a.display_name.toLowerCase().includes(q.toLowerCase())),
    [q, artists.data],
  );

  return (
    <>
      <PageHeader
        title="Artists"
        description="Roster across all Media Rosenqvist services."
        actions={<Btn><Plus className="h-4 w-4" /> New artist</Btn>}
      />
      <SetupBanner />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {artists.isLoading && <p className="text-sm text-muted-foreground">Loading artists…</p>}
      {artists.error && <p className="text-sm text-destructive">{(artists.error as Error).message}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((a) => {
          const trackCount = (tracks.data ?? []).filter((t) => t.artist_id === a.id).length;
          const albumCount = (albums.data ?? []).filter((al) => al.artist_id === a.id).length;
          return (
            <article key={a.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-accent text-accent-foreground font-semibold">
                  {a.display_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{a.display_name}</div>
                  <div className="text-xs text-muted-foreground">{a.country || "—"}</div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{a.bio}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{albumCount} albums</span>
                <span>{trackCount} tracks</span>
              </div>
            </article>
          );
        })}
        {!artists.isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No artists match.</p>
        )}
      </div>
    </>
  );
}
