import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError, type Track } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { CatalogTable, type CatalogColumn } from "@/components/CatalogTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useOptimisticListAdd } from "@/hooks/useOptimisticList";
import { Plus, AlertTriangle } from "lucide-react";

const URL = "https://catalogusmusicus.mediarosenqvist.com/tracks";

export const Route = createFileRoute("/tracks")({
  head: () => ({
    meta: [
      { title: "Tracks – Catalogus Musicus" },
      { name: "description", content: "Individual tracks across releases in the Catalogus Musicus music catalog — ISRC, artist and metadata management." },
      { property: "og:title", content: "Tracks – Catalogus Musicus" },
      { property: "og:description", content: "Tracks across releases in the Media Rosenqvist music catalog." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: TracksPage,
});

function TracksPage() {
  const q = useQuery({ queryKey: ["tracks"], queryFn: api.listTracks, retry: false });
  const artists = useQuery({ queryKey: ["artists"], queryFn: api.listArtists, retry: false });
  const [form, setForm] = useState({ title: "", artistId: "", isrc: "" });

  const create = useOptimisticListAdd<typeof form, Track>(
    ["tracks"],
    (vars) => api.createTrack({ title: vars.title, artistId: vars.artistId || undefined, isrc: vars.isrc || undefined }),
    (vars) => ({ id: `optimistic-${Date.now()}`, title: vars.title, isrc: vars.isrc || undefined, status: "draft" }),
  );

  const columns: CatalogColumn<Track>[] = [
    {
      key: "title",
      header: "Title",
      value: (t) => t.title,
      cell: (t) => (
        t.id.startsWith("optimistic-") ? (
          <span className="opacity-60">{t.title}</span>
        ) : (
          <Link to="/tracks/$id" params={{ id: t.id }} className="font-medium hover:underline">{t.title}</Link>
        )
      ),
    },
    { key: "isrc", header: "ISRC", value: (t) => t.isrc, cell: (t) => <span className="font-mono text-xs text-muted-foreground">{t.isrc ?? "—"}</span>, hideBelow: "md" },
    { key: "status", header: "Status", value: (t) => t.status, cell: (t) => (t.status ? <StatusBadge status={t.status} size="sm" /> : <span className="text-muted-foreground">—</span>) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Tracks" description="All registered tracks." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.title) {
            create.mutate(form);
            setForm({ title: "", artistId: "", isrc: "" });
          }
        }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="w-56">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.artistId} onChange={(e) => setForm({ ...form, artistId: e.target.value })}>
            <option value="">—</option>
            {(artists.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>{a.displayName ?? a.display_name ?? a.name}</option>
            ))}
          </select>
        </div>
        <div className="w-44">
          <label className="block text-xs font-medium text-muted-foreground mb-1">ISRC</label>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.isrc} onChange={(e) => setForm({ ...form, isrc: e.target.value })} placeholder="SE-XXX-25-00001" />
        </div>
        <Btn type="submit" disabled={!form.title}><Plus className="h-4 w-4" /> Create track</Btn>
      </form>

      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      )}

      <CatalogTable<Track>
        rows={q.data}
        columns={columns}
        isLoading={q.isLoading}
        emptyMessage="No tracks yet"
        searchPlaceholder="Search tracks by title or ISRC…"
      />
    </div>
  );
}
