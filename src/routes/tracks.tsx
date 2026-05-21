import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError, type Track } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Plus, Music2, AlertTriangle } from "lucide-react";

const URL = "https://soundloom-core.lovable.app/tracks";

export const Route = createFileRoute("/tracks")({
  head: () => ({
    meta: [
      { title: "Tracks – Soundloom" },
      { name: "description", content: "Individual tracks across releases in the Soundloom music catalog — ISRC, artist and metadata management." },
      { property: "og:title", content: "Tracks – Soundloom" },
      { property: "og:description", content: "Tracks across releases in the Media Rosenqvist music catalog." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: TracksPage,
});


function TracksPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["tracks"], queryFn: api.listTracks, retry: false });
  const artists = useQuery({ queryKey: ["artists"], queryFn: api.listArtists, retry: false });
  const [form, setForm] = useState({ title: "", artistId: "", isrc: "" });
  const create = useMutation({
    mutationFn: () => api.createTrack({ title: form.title, artistId: form.artistId || undefined, isrc: form.isrc || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tracks"] }); setForm({ title: "", artistId: "", isrc: "" }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Tracks" description="All registered tracks." />

      <form onSubmit={(e) => { e.preventDefault(); if (form.title) create.mutate(); }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
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
        <Btn type="submit" disabled={create.isPending || !form.title}><Plus className="h-4 w-4" /> {create.isPending ? "Creating…" : "Create track"}</Btn>
      </form>

      {q.isLoading && <div className="text-sm text-muted-foreground">Loading tracks…</div>}
      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      )}
      {!q.isLoading && !q.error && (q.data?.length ?? 0) === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Music2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-sm font-medium">No tracks yet</div>
        </div>
      )}
      {(q.data?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left px-4 py-2">Title</th><th className="text-left px-4 py-2">ISRC</th><th className="text-left px-4 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.data!.map((t: Track) => (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2"><Link to="/tracks/$id" params={{ id: t.id }} className="hover:underline">{t.title}</Link></td>
                  <td className="px-4 py-2 text-muted-foreground">{t.isrc ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
