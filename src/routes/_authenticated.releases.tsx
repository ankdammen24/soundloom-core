import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Plus, Send, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

export const Route = createFileRoute("/_authenticated/releases")({
  head: () => ({ meta: [{ title: "Releases – Music Catalog" }] }),
  component: ReleasesPage,
});

type Release = {
  id: string; title: string; slug: string; type: string;
  release_date: string | null; artist_id: string; upc: string | null;
};
type Artist = { id: string; name: string };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `release-${Date.now()}`;
}

function ReleasesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", artist_id: "", type: "single" });

  const releases = useQuery({
    queryKey: ["releases"],
    queryFn: async () => {
      const { data, error } = await supabase.from("releases").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Release[];
    },
  });

  const artists = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data } = await supabase.from("artists").select("id, name").order("name");
      return (data ?? []) as Artist[];
    },
  });

  const create = useMutation({
    mutationFn: async (v: typeof form) => {
      const { error } = await supabase.from("releases").insert({
        title: v.title,
        slug: slugify(v.title),
        type: v.type as "single" | "ep" | "album",
        artist_id: v.artist_id,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ title: "", artist_id: "", type: "single" });
      qc.invalidateQueries({ queryKey: ["releases"] });
    },
  });

  const canCreate = (user?.roles ?? []).some((r) => ["admin", "editor", "artist"].includes(r));
  const artistMap = new Map((artists.data ?? []).map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <PageHeader title="Releases" description="Singles, EPs and albums." />

      {canCreate && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (form.title && form.artist_id) create.mutate(form); }}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} required>
              <option value="">Select artist…</option>
              {(artists.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
          <Btn type="submit" disabled={!form.title || !form.artist_id || create.isPending}>
            <Plus className="h-4 w-4" /> Create
          </Btn>
        </form>
      )}

      {create.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" /><div>{(create.error as Error).message}</div>
        </div>
      )}

      {!releases.isLoading && (releases.data ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Send className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-sm font-medium">No releases yet</div>
        </div>
      )}

      {(releases.data ?? []).length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Artist</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Release date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(releases.data ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{artistMap.get(r.artist_id) ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{r.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.release_date ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
