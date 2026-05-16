import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { StatusBadge } from "@/components/StatusBadge";
import { SetupBanner, LoadingRows, EmptyRow, ErrorRow } from "@/components/Setup";
import { Toolbar } from "./albums";
import { useArtists, useAlbums, useTracks, buildLookup } from "@/lib/catalog";
import type { TrackStatus, RightsStatus } from "@/lib/types";
import { Plus, Music2 } from "lucide-react";

const trackStatuses: (TrackStatus | "all")[] = ["all", "draft", "uploaded", "processing", "needs_metadata", "needs_rights_check", "approved", "published", "distributed", "archived"];
const rightsStatuses: (RightsStatus | "all")[] = ["all", "unknown", "incomplete", "cleared", "blocked"];

export const Route = createFileRoute("/tracks")({
  head: () => ({ meta: [{ title: "Tracks – Music Catalog Core" }] }),
  component: TracksPage,
});

function TracksPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof trackStatuses)[number]>("all");
  const [rights, setRights] = useState<(typeof rightsStatuses)[number]>("all");

  const tracks = useTracks();
  const artists = useArtists();
  const albums = useAlbums();
  const findArtist = buildLookup(artists.data);
  const findAlbum = buildLookup(albums.data);

  const rows = useMemo(() => (tracks.data ?? []).filter((t) => {
    const a = findArtist(t.artist_id);
    const matchQ = (t.title + " " + (a?.display_name ?? "") + " " + t.isrc).toLowerCase().includes(q.toLowerCase());
    const ms = status === "all" || t.status === status;
    const mr = rights === "all" || t.rights_status === rights;
    return matchQ && ms && mr;
  }), [q, status, rights, tracks.data, findArtist]);

  return (
    <>
      <PageHeader
        title="Tracks"
        description="Master assets, metadata, ISRC and lifecycle status."
        actions={<Btn><Plus className="h-4 w-4" /> New track</Btn>}
      />
      <SetupBanner />

      <Toolbar
        q={q} onQ={setQ}
        filters={
          <>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize">
              {trackStatuses.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s.replace(/_/g, " ")}</option>)}
            </select>
            <select value={rights} onChange={(e) => setRights(e.target.value as typeof rights)} className="h-9 rounded-md border border-input bg-background px-3 text-sm capitalize">
              {rightsStatuses.map((s) => <option key={s} value={s}>{s === "all" ? "All rights" : `Rights: ${s}`}</option>)}
            </select>
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <Th>Title</Th><Th>Artist</Th><Th>Album</Th><Th>ISRC</Th><Th>Duration</Th><Th>Genre</Th><Th>Rights</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tracks.isLoading && <LoadingRows cols={8} />}
            {tracks.error && <ErrorRow cols={8} error={tracks.error} />}
            {!tracks.isLoading && rows.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded bg-accent text-accent-foreground">
                      <Music2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.version}</div>
                    </div>
                  </div>
                </Td>
                <Td>{findArtist(t.artist_id)?.display_name ?? "—"}</Td>
                <Td>{findAlbum(t.album_id)?.title ?? <span className="text-muted-foreground">—</span>}</Td>
                <Td className="font-mono text-xs">{t.isrc || <span className="text-muted-foreground">—</span>}</Td>
                <Td>{fmtDuration(t.duration)}</Td>
                <Td>{t.genre || "—"}</Td>
                <Td><StatusBadge status={t.rights_status} /></Td>
                <Td><StatusBadge status={t.status} /></Td>
              </tr>
            ))}
            {!tracks.isLoading && !tracks.error && rows.length === 0 && <EmptyRow cols={8} label="No tracks match." />}
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

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
