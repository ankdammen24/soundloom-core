import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { SetupBanner } from "@/components/Setup";
import { useArtists, useTracks, useAlbums, queryKeys } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import { Plus, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/artists")({
  head: () => ({ meta: [{ title: "Artists – Music Catalog Core" }] }),
  component: ArtistsPage,
});

function ArtistsPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", display_name: "", country: "", bio: "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const qc = useQueryClient();

  const artists = useArtists();
  const tracks = useTracks();
  const albums = useAlbums();

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name || form.display_name,
        display_name: form.display_name || form.name,
        country: form.country,
        bio: form.bio,
      };
      const { error } = await supabase.from("artists").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.artists });
      setMsg({ kind: "ok", text: "Artist created." });
      setForm({ name: "", display_name: "", country: "", bio: "" });
      setOpen(false);
      setTimeout(() => setMsg(null), 2500);
    },
    onError: (err: unknown) => {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Insert failed." });
    },
  });

  const rows = useMemo(
    () => (artists.data ?? []).filter((a) => a.display_name.toLowerCase().includes(q.toLowerCase())),
    [q, artists.data],
  );

  return (
    <div className="contents">
      <PageHeader
        title="Artists"
        description="Roster across all Media Rosenqvist services."
        actions={<Btn onClick={() => setOpen((v) => !v)}><Plus className="h-4 w-4" /> New artist</Btn>}
      />
      <SetupBanner />

      {msg?.kind === "ok" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-success/15 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> {msg.text}
        </div>
      )}
      {msg?.kind === "err" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {msg.text}
        </div>
      )}

      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (form.display_name || form.name) create.mutate(); }}
          className="mb-6 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2"
        >
          <input required value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="Display name *" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="Country (e.g. SE)" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Bio" rows={2} className="sm:col-span-2 rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <div className="sm:col-span-2 flex gap-2">
            <Btn type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Save artist"}</Btn>
            <Btn type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Btn>
          </div>
        </form>
      )}

      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {artists.isLoading && <p className="text-sm text-muted-foreground">Loading artists…</p>}
      {artists.error && <p className="text-sm text-destructive">{(artists.error as Error).message}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((a) => {
          const trackCount = (tracks.data ?? []).filter((t) => t.artist_id === a.id).length;
          const albumCount = (albums.data ?? []).filter((al) => al.artist_id === a.id).length;
          return (
            <article key={a.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-accent text-accent-foreground font-semibold">
                  {a.display_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{a.display_name}</div>
                  <div className="text-xs text-muted-foreground">{a.country || "—"}</div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{a.bio}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{albumCount} albums</span>
                <span>{trackCount} tracks</span>
              </div>
            </article>
          );
        })}
        {!artists.isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No artists match.</p>
        )}
      </div>
    </div>
  );
}
