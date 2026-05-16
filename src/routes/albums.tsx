import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { StatusBadge } from "@/components/StatusBadge";
import { SetupBanner, LoadingRows, EmptyRow, ErrorRow } from "@/components/Setup";
import { useAlbums, useArtists, useTracks, buildLookup } from "@/lib/catalog";
import type { AlbumStatus } from "@/lib/types";
import { Plus, Search, Disc3 } from "lucide-react";

const statusFilters: (AlbumStatus | "all")[] = ["all", "draft", "scheduled", "released", "archived"];

export const Route = createFileRoute("/albums")({
  head: () => ({ meta: [{ title: "Albums – Music Catalog Core" }] }),
  component: AlbumsPage,
});

function AlbumsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("all");

  const albums = useAlbums();
  const artists = useArtists();
  const tracks = useTracks();
  const findArtist = buildLookup(artists.data);

  const rows = useMemo(() => (albums.data ?? []).filter((a) => {
    const matchQ = a.title.toLowerCase().includes(q.toLowerCase());
    const matchS = status === "all" || a.status === status;
    return matchQ && matchS;
  }), [q, status, albums.data]);

  return (
    <>
      <PageHeader
        title="Albums"
        description="Album, EP and compilation containers."
        actions={<Btn><Plus className="h-4 w-4" /> New album</Btn>}
      />
      <SetupBanner />

      <Toolbar
        q={q} onQ={setQ}
        filters={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize"
          >
            {statusFilters.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
          </select>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <Th>Title</Th><Th>Artist</Th><Th>Tracks</Th><Th>Release date</Th><Th>UPC</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {albums.isLoading && <LoadingRows cols={6} />}
            {albums.error && <ErrorRow cols={6} error={albums.error} />}
            {!albums.isLoading && rows.map((a) => {
              const tc = (tracks.data ?? []).filter((t) => t.album_id === a.id).length;
              return (
                <tr key={a.id} className="hover:bg-muted/30">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded bg-accent text-accent-foreground">
                        <Disc3 className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{a.title}</span>
                    </div>
                  </Td>
                  <Td>{findArtist(a.artist_id)?.display_name ?? "—"}</Td>
                  <Td>{tc}</Td>
                  <Td>{a.release_date || <span className="text-muted-foreground">—</span>}</Td>
                  <Td className="font-mono text-xs">{a.upc || <span className="text-muted-foreground">—</span>}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                </tr>
              );
            })}
            {!albums.isLoading && !albums.error && rows.length === 0 && <EmptyRow cols={6} label="No albums match." />}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-4 py-3 " + (className ?? "")}>{children}</td>;
}

export function Toolbar({ q, onQ, filters }: { q: string; onQ: (v: string) => void; filters?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative max-w-sm flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q} onChange={(e) => onQ(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {filters}
    </div>
  );
}
