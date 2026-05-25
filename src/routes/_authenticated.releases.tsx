import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError, type Release } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { CatalogTable, type CatalogColumn } from "@/components/CatalogTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Artwork } from "@/components/media/Artwork";
import { useOptimisticListAdd } from "@/hooks/useOptimisticList";
import { Plus, AlertTriangle } from "lucide-react";

const URL = "https://catalogusmusicus.mediarosenqvist.com/releases";

export const Route = createFileRoute("/_authenticated/releases")({
  head: () => ({
    meta: [
      { title: "Releases – Catalogus Musicus" },
      { name: "description", content: "Browse and manage singles, EPs and albums in the Catalogus Musicus music catalog for Media Rosenqvist." },
      { property: "og:title", content: "Releases – Catalogus Musicus" },
      { property: "og:description", content: "Singles, EPs and albums in the Media Rosenqvist music catalog." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ReleasesPage,
});

function ReleasesPage() {
  const q = useQuery({ queryKey: ["releases"], queryFn: api.listReleases, retry: false });
  const artists = useQuery({ queryKey: ["artists"], queryFn: api.listArtists, retry: false });
  const [form, setForm] = useState({ title: "", artistId: "", type: "single" });

  const create = useOptimisticListAdd<typeof form, Release>(
    ["releases"],
    (vars) => api.createRelease({ title: vars.title, artistId: vars.artistId || undefined, type: vars.type }),
    (vars) => ({ id: `optimistic-${Date.now()}`, title: vars.title, type: vars.type, status: "draft" }),
  );

  const columns: CatalogColumn<Release>[] = [
    {
      key: "title",
      header: "Title",
      value: (r) => r.title,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Artwork src={r.coverUrl} seed={r.id + r.title} size="sm" alt={r.title} />
          {r.id.startsWith("optimistic-") ? (
            <span className="opacity-60">{r.title}</span>
          ) : (
            <Link to="/releases/$id" params={{ id: r.id }} className="font-medium hover:underline">{r.title}</Link>
          )}
        </div>
      ),
    },
    { key: "type", header: "Type", value: (r) => r.type, cell: (r) => <span className="capitalize text-muted-foreground">{r.type ?? "—"}</span> },
    { key: "releaseDate", header: "Release date", value: (r) => r.releaseDate, cell: (r) => <span className="text-muted-foreground">{r.releaseDate ?? "—"}</span>, hideBelow: "lg" },
    { key: "status", header: "Status", value: (r) => r.status, cell: (r) => (r.status ? <StatusBadge status={r.status} size="sm" /> : <span className="text-muted-foreground">—</span>) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Releases" description="Singles, EPs, albums." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.title) {
            create.mutate(form);
            setForm({ title: "", artistId: "", type: "single" });
          }
        }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
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
        <div className="w-32">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="single">Single</option>
            <option value="ep">EP</option>
            <option value="album">Album</option>
          </select>
        </div>
        <Btn type="submit" disabled={!form.title}><Plus className="h-4 w-4" /> Create release</Btn>
      </form>

      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      )}

      <CatalogTable<Release>
        rows={q.data}
        columns={columns}
        isLoading={q.isLoading}
        emptyMessage="No releases yet"
        searchPlaceholder="Search releases…"
      />
    </div>
  );
}
