import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { StatusBadge } from "@/components/StatusBadge";
import { Toolbar } from "./albums";
import { rights, tracks, findArtist } from "@/lib/mock-data";
import { Check, X, Scale } from "lucide-react";

export const Route = createFileRoute("/rights")({
  head: () => ({ meta: [{ title: "Rights & ownership – Music Catalog Core" }] }),
  component: RightsPage,
});

function RightsPage() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => rights.filter((r) => {
    const t = tracks.find((x) => x.id === r.track_id);
    return ((t?.title ?? "") + " " + r.composer + " " + r.publisher).toLowerCase().includes(q.toLowerCase());
  }), [q]);

  return (
    <>
      <PageHeader
        title="Rights & ownership"
        description="Composer, publisher, label, STIM and SAMI registration."
        actions={<Btn variant="outline"><Scale className="h-4 w-4" /> Run rights check</Btn>}
      />

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
            {rows.map((r) => {
              const t = tracks.find((x) => x.id === r.track_id);
              return (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t?.title ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{t && findArtist(t.artist_id)?.display_name}</div>
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
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No rights records match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
