import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Plus, Music2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { artistsApi, tracksApi } from "@/lib/api/catalog";

export const Route = createFileRoute("/_authenticated/tracks")({
  head: () => ({ meta: [{ title: "Tracks – Music Catalog" }] }),
  component: TracksPage,
});

function TracksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", artist_id: "", isrc: "" });

  const tracks = useQuery({ queryKey: ["tracks"], queryFn: () => tracksApi.list() });
  const artists = useQuery({ queryKey: ["artists"], queryFn: () => artistsApi.list() });

  const create = useMutation({
    mutationFn: (v: typeof form) =>
      tracksApi.create({ title: v.title, artist_id: v.artist_id, isrc: v.isrc || null }),
    onSuccess: () => {
      setForm({ title: "", artist_id: "", isrc: "" });
      qc.invalidateQueries({ queryKey: ["tracks"] });
    },
  });

  const canCreate = (user?.roles ?? []).some((r) => ["admin", "editor", "artist"].includes(r));
  const artistMap = new Map((artists.data ?? []).map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <PageHeader title="Tracks" description="All registered tracks." />

      {canCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.title && form.artist_id) create.mutate(form);
          }}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              value={form.artist_id}
              onChange={(e) => setForm({ ...form, artist_id: e.target.value })}
            >
              <option value="">Select artist…</option>
              {(artists.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1">ISRC</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.isrc}
              onChange={(e) => setForm({ ...form, isrc: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <Btn type="submit" disabled={!form.title || !form.artist_id || create.isPending}>
            <Plus className="h-4 w-4" /> Create
          </Btn>
        </form>
      )}

      {create.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{(create.error as Error).message}</div>
        </div>
      )}

      {!tracks.isLoading && (tracks.data ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Music2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-sm font-medium">No tracks yet</div>
        </div>
      )}

      {(tracks.data ?? []).length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Artist</th>
                <th className="px-4 py-3 text-left font-medium">ISRC</th>
                <th className="px-4 py-3 text-left font-medium">Genre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(tracks.data ?? []).map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {artistMap.get(t.artist_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.isrc ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.genre ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
