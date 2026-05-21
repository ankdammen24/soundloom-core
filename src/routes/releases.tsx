import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError, type Release } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Plus, Disc3, AlertTriangle } from "lucide-react";

const URL = "https://catalog.mediarosenqvist.com/releases";

export const Route = createFileRoute("/releases")({
  head: () => ({
    meta: [
      { title: "Releases – Soundloom" },
      { name: "description", content: "Browse and manage singles, EPs and albums in the Soundloom music catalog for Media Rosenqvist." },
      { property: "og:title", content: "Releases – Soundloom" },
      { property: "og:description", content: "Singles, EPs and albums in the Media Rosenqvist music catalog." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ReleasesPage,
});


function ReleasesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["releases"], queryFn: api.listReleases, retry: false });
  const artists = useQuery({ queryKey: ["artists"], queryFn: api.listArtists, retry: false });
  const [form, setForm] = useState({ title: "", artistId: "", type: "single" });
  const create = useMutation({
    mutationFn: () => api.createRelease({ title: form.title, artistId: form.artistId || undefined, type: form.type }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["releases"] }); setForm({ title: "", artistId: "", type: "single" }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Releases" description="Singles, EPs, albums." />

      <form onSubmit={(e) => { e.preventDefault(); if (form.title) create.mutate(); }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
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
        <Btn type="submit" disabled={create.isPending || !form.title}><Plus className="h-4 w-4" /> {create.isPending ? "Creating…" : "Create release"}</Btn>
      </form>

      {q.isLoading && <div className="text-sm text-muted-foreground">Loading releases…</div>}
      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      )}
      {!q.isLoading && !q.error && (q.data?.length ?? 0) === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Disc3 className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-sm font-medium">No releases yet</div>
        </div>
      )}
      {(q.data?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left px-4 py-2">Title</th><th className="text-left px-4 py-2">Type</th><th className="text-left px-4 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.data!.map((r: Release) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2"><Link to="/releases/$id" params={{ id: r.id }} className="hover:underline">{r.title}</Link></td>
                  <td className="px-4 py-2 text-muted-foreground">{r.type ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
