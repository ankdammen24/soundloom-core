import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { StatusBadge } from "@/components/StatusBadge";
import { SetupBanner, LoadingRows, EmptyRow, ErrorRow } from "@/components/Setup";
import { Toolbar } from "./albums";
import { useReleases, useArtists, buildLookup } from "@/lib/catalog";
import { Plus, Send, Download } from "lucide-react";

export const Route = createFileRoute("/releases")({
  head: () => ({ meta: [{ title: "Releases – Music Catalog Core" }] }),
  component: ReleasesPage,
});

function ReleasesPage() {
  const [q, setQ] = useState("");
  const releases = useReleases();
  const artists = useArtists();
  const findArtist = buildLookup(artists.data);
  const rows = useMemo(
    () => (releases.data ?? []).filter((r) => r.title.toLowerCase().includes(q.toLowerCase())),
    [q, releases.data],
  );

  return (
    <>
      <PageHeader
        title="Releases"
        description="Public release plan and distribution status across DSPs."
        actions={
          <>
            <Btn variant="outline"><Download className="h-4 w-4" /> Export for distribution</Btn>
            <Btn><Plus className="h-4 w-4" /> New release</Btn>
          </>
        }
      />
      <SetupBanner />

      <Toolbar q={q} onQ={setQ} />

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Release</th>
              <th className="px-4 py-3 text-left font-medium">Artist</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Release date</th>
              <th className="px-4 py-3 text-left font-medium">UPC</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Distribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {releases.isLoading && <LoadingRows cols={7} />}
            {releases.error && <ErrorRow cols={7} error={releases.error} />}
            {!releases.isLoading && rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded bg-accent text-accent-foreground">
                      <Send className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{r.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{findArtist(r.artist_id)?.display_name ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{r.release_type}</td>
                <td className="px-4 py-3">{r.release_date || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.upc || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.distribution_status} /></td>
              </tr>
            ))}
            {!releases.isLoading && !releases.error && rows.length === 0 && <EmptyRow cols={7} label="No releases match." />}
          </tbody>
        </table>
      </div>
    </>
  );
}
