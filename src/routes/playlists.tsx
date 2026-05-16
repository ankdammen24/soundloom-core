import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { playlists, playlistTracks, tracks, findArtist } from "@/lib/mock-data";
import { Plus, ListMusic, Radio } from "lucide-react";

export const Route = createFileRoute("/playlists")({
  head: () => ({ meta: [{ title: "Playlists – Music Catalog Core" }] }),
  component: PlaylistsPage,
});

const scopeLabel: Record<string, string> = {
  radio_core: "Radio Core",
  music_core: "Music Core",
  radio_uppsala: "Radio Uppsala",
  all: "All services",
};

function PlaylistsPage() {
  return (
    <>
      <PageHeader
        title="Playlists"
        description="Editorial and rotation lists consumed by Radio Core, Music Core and Radio Uppsala."
        actions={<Btn><Plus className="h-4 w-4" /> New playlist</Btn>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {playlists.map((p) => {
          const items = playlistTracks
            .filter((pt) => pt.playlist_id === p.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          return (
            <article key={p.id} className="rounded-lg border border-border bg-card">
              <header className="flex items-start justify-between border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <ListMusic className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  <Radio className="h-3 w-3" /> {scopeLabel[p.station_scope]}
                </span>
              </header>
              <ol className="divide-y divide-border">
                {items.map((pt, i) => {
                  const t = tracks.find((x) => x.id === pt.track_id);
                  if (!t) return null;
                  return (
                    <li key={pt.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{t.title}</div>
                          <div className="truncate text-xs text-muted-foreground">{findArtist(t.artist_id)?.display_name}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{fmt(t.duration)}</span>
                    </li>
                  );
                })}
                {items.length === 0 && (
                  <li className="px-5 py-6 text-sm text-muted-foreground">No tracks yet.</li>
                )}
              </ol>
            </article>
          );
        })}
      </div>
    </>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60); const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
