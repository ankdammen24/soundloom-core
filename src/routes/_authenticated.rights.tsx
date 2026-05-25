import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { StatusBadge } from "@/components/StatusBadge";
import { SetupBanner, LoadingRows, ErrorRow, EmptyRow } from "@/components/Setup";
import { Toolbar } from "./albums";
import { useRights, useTracks, useArtists, buildLookup } from "@/lib/catalog";
import { Check, X, Scale } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rights")({
  head: () => ({ meta: [{ title: "Rights & ownership – Music Catalog Core" }] }),
  component: RightsPage,
});

function RightsPage() {
  const [q, setQ] = useState("");
  const rights = useRights();
  const tracks = useTracks();
  const artists = useArtists();
  const findTrack = buildLookup(tracks.data);
  const findArtist = buildLookup(artists.data);

  const rows = useMemo(() => (rights.data ?? []).filter((r) => {
    const t = findTrack(r.track_id);
    return ((t?.title ?? "") + " " + r.composer + " " + r.publisher).toLowerCase().includes(q.toLowerCase());
  }), [q, rights.data, findTrack]);

  return (
    <>
      <PageHeader
        title="Rights & ownership"
        description="Composer, publisher, label, STIM and SAMI registration."
        actions={<Btn variant="outline"><Scale className="h-4 w-4" /> Run rights check</Btn>}
      />
      <SetupBanner />

      <Toolbar q={q} onQ={setQ} />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Track</th>
              <th className="px-4 py-3 text-left font-medium">Composer</th>
              <th className="px-4 py-3 text-left font-medium">Publisher</th>
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-left font-medium">ISWC</th>
              <th className="px-4 py-3 text-center font-medium">STIM</th>
              <th className="px-4 py-3 text-center font-medium">SAMI</th>
              <th className="px-4 py-3 text-left font-medium">Track status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rights.isLoading && <LoadingRows cols={8} />}
            {rights.error && <ErrorRow cols={8} error={rights.error} />}
            {!rights.isLoading && rows.map((r) => {
              const t = findTrack(r.track_id);
              return (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t?.title ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{t && (findArtist(t.artist_id)?.display_name ?? "—")}</div>
                  </td>
                  <td className="px-4 py-3">{r.composer || "—"}</td>
                  <td className="px-4 py-3">{r.publisher || <span className="text-muted-foreground">missing</span>}</td>
                  <td className="px-4 py-3">{r.label || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.iswc || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-center">{r.stim_registered ? <Check className="mx-auto h-4 w-4 text-success" /> : <X className="mx-auto h-4 w-4 text-muted-foreground" />}</td>
                  <td className="px-4 py-3 text-center">{r.sami_registered ? <Check className="mx-auto h-4 w-4 text-success" /> : <X className="mx-auto h-4 w-4 text-muted-foreground" />}</td>
                  <td className="px-4 py-3">{t && <StatusBadge status={t.rights_status} />}</td>
                </tr>
              );
            })}
            {!rights.isLoading && !rights.error && rows.length === 0 && <EmptyRow cols={8} label="No rights records." />}
          </tbody>
        </table>
      </div>
    </>
  );
}
