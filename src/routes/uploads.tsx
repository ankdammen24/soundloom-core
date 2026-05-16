import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { StatusBadge } from "@/components/StatusBadge";
import { SetupBanner } from "@/components/Setup";
import { useArtists, useAlbums, useTracks, queryKeys } from "@/lib/catalog";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Upload, FileAudio, Wand2, Volume2, Radio, Download, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/uploads")({
  head: () => ({ meta: [{ title: "Uploads – Music Catalog Core" }] }),
  component: UploadsPage,
});

function UploadsPage() {
  const artists = useArtists();
  const albums = useAlbums();
  const tracks = useTracks();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: "", artist_id: "", album_id: "",
    isrc: "", genre: "", master_file_name: "",
  });
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        artist_id: form.artist_id,
        album_id: form.album_id || null,
        isrc: form.isrc,
        genre: form.genre,
        version: "Original",
        status: "draft" as const,
        rights_status: "unknown" as const,
        master_file_key: form.master_file_name ? `pending/${form.master_file_name}` : null,
      };
      const { error } = await supabase.from("tracks").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tracks });
      setMsg({ kind: "ok", text: "Draft track saved to Supabase." });
      setForm({ ...form, title: "", isrc: "", master_file_name: "" });
      setTimeout(() => setMsg(null), 2500);
    },
    onError: (err: unknown) => {
      const text = err instanceof Error ? err.message : "Insert failed.";
      setMsg({ kind: "err", text });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.artist_id) return;
    if (!supabaseConfigured) {
      setMsg({ kind: "err", text: "Connect Supabase first (see Settings)." });
      return;
    }
    create.mutate();
  };

  const artistAlbums = (albums.data ?? []).filter((a) => a.artist_id === form.artist_id);
  const recentDrafts = [...(tracks.data ?? [])]
    .filter((t) => t.status === "draft" || t.status === "uploaded")
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Uploads"
        description="Register a new track in Supabase. R2 master upload runs once storage is wired."
      />
      <SetupBanner />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">New track registration</h2>

          <Field label="Title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} placeholder="Track title" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Artist">
              <select
                value={form.artist_id}
                onChange={(e) => setForm({ ...form, artist_id: e.target.value, album_id: "" })}
                className={input}
                required
              >
                <option value="">— Select artist —</option>
                {(artists.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.display_name}</option>)}
              </select>
            </Field>
            <Field label="Album (optional)">
              <select value={form.album_id} onChange={(e) => setForm({ ...form, album_id: e.target.value })} className={input}>
                <option value="">— None —</option>
                {artistAlbums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ISRC"><input value={form.isrc} onChange={(e) => setForm({ ...form, isrc: e.target.value })} className={input} placeholder="SE-XXX-25-00000" /></Field>
            <Field label="Genre"><input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className={input} placeholder="Indie folk" /></Field>
          </div>

          <Field label="Master file">
            <label className="flex items-center gap-3 rounded-md border border-dashed border-input bg-background px-4 py-6 cursor-pointer hover:border-primary/50">
              <FileAudio className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{form.master_file_name || "Choose WAV / FLAC / AIFF"}</div>
                <div className="text-xs text-muted-foreground">Filename is saved as a placeholder key. R2 upload runs once configured.</div>
              </div>
              <input
                type="file" accept="audio/*" className="hidden"
                onChange={(e) => setForm({ ...form, master_file_name: e.target.files?.[0]?.name ?? "" })}
              />
            </label>
          </Field>

          <div className="flex flex-wrap gap-2 pt-2">
            <Btn type="submit" disabled={create.isPending}><Upload className="h-4 w-4" /> {create.isPending ? "Saving…" : "Register track"}</Btn>
            <Btn type="button" variant="outline"><Upload className="h-4 w-4" /> Upload master file</Btn>
            <Btn type="button" variant="outline"><Wand2 className="h-4 w-4" /> Generate preview</Btn>
            <Btn type="button" variant="outline"><Volume2 className="h-4 w-4" /> Normalize audio</Btn>
            <Btn type="button" variant="outline"><Radio className="h-4 w-4" /> Publish to Radio Core</Btn>
            <Btn type="button" variant="outline"><Download className="h-4 w-4" /> Export for distribution</Btn>
          </div>

          {msg?.kind === "ok" && (
            <div className="flex items-center gap-2 rounded-md bg-success/15 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> {msg.text}
            </div>
          )}
          {msg?.kind === "err" && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {msg.text}
            </div>
          )}
        </form>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent drafts</h2>
            <p className="text-xs text-muted-foreground">Reads live from Supabase.</p>
          </div>
          <ul className="divide-y divide-border">
            {tracks.isLoading && <li className="px-5 py-8 text-sm text-muted-foreground">Loading…</li>}
            {!tracks.isLoading && recentDrafts.length === 0 && (
              <li className="px-5 py-8 text-sm text-muted-foreground">No drafts yet.</li>
            )}
            {recentDrafts.map((d) => (
              <li key={d.id} className="px-5 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{d.master_file_key ?? "no file"}</div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
