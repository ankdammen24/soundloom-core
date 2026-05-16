import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { StatusBadge } from "@/components/StatusBadge";
import { artists, albums } from "@/lib/mock-data";
import { Upload, FileAudio, Wand2, Volume2, Radio, Download, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/uploads")({
  head: () => ({ meta: [{ title: "Uploads – Music Catalog Core" }] }),
  component: UploadsPage,
});

interface DraftTrack {
  id: string;
  title: string;
  artist_id: string;
  album_id: string;
  isrc: string;
  genre: string;
  master_file_name: string;
  created_at: string;
}

function UploadsPage() {
  const [drafts, setDrafts] = useState<DraftTrack[]>([]);
  const [form, setForm] = useState({
    title: "", artist_id: artists[0]?.id ?? "", album_id: "",
    isrc: "", genre: "", master_file_name: "",
  });
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.artist_id) return;
    setDrafts((d) => [{
      id: crypto.randomUUID(),
      ...form,
      created_at: new Date().toISOString(),
    }, ...d]);
    setForm({ ...form, title: "", isrc: "", master_file_name: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const artistAlbums = albums.filter((a) => a.artist_id === form.artist_id);

  return (
    <>
      <PageHeader
        title="Uploads"
        description="Register a new track's metadata. Real audio upload to R2 wires in next."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">New track registration</h2>

          <Field label="Title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} placeholder="Track title" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Artist">
              <select value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value, album_id: "" })} className={input}>
                {artists.map((a) => <option key={a.id} value={a.id}>{a.display_name}</option>)}
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
                <div className="text-xs text-muted-foreground">File metadata is registered now; R2 upload runs once configured.</div>
              </div>
              <input
                type="file" accept="audio/*" className="hidden"
                onChange={(e) => setForm({ ...form, master_file_name: e.target.files?.[0]?.name ?? "" })}
              />
            </label>
          </Field>

          <div className="flex flex-wrap gap-2 pt-2">
            <Btn type="submit"><Upload className="h-4 w-4" /> Register track</Btn>
            <Btn type="button" variant="outline"><Upload className="h-4 w-4" /> Upload master file</Btn>
            <Btn type="button" variant="outline"><Wand2 className="h-4 w-4" /> Generate preview</Btn>
            <Btn type="button" variant="outline"><Volume2 className="h-4 w-4" /> Normalize audio</Btn>
            <Btn type="button" variant="outline"><Radio className="h-4 w-4" /> Publish to Radio Core</Btn>
            <Btn type="button" variant="outline"><Download className="h-4 w-4" /> Export for distribution</Btn>
          </div>

          {saved && (
            <div className="flex items-center gap-2 rounded-md bg-success/15 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Draft track registered.
            </div>
          )}
        </form>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent registrations (this session)</h2>
            <p className="text-xs text-muted-foreground">In-memory queue. Saves to Supabase once wired.</p>
          </div>
          <ul className="divide-y divide-border">
            {drafts.length === 0 && <li className="px-5 py-8 text-sm text-muted-foreground">Nothing registered yet.</li>}
            {drafts.map((d) => {
              const a = artists.find((x) => x.id === d.artist_id);
              return (
                <li key={d.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{d.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{a?.display_name} · {d.master_file_name || "no file"}</div>
                    </div>
                    <StatusBadge status="draft" />
                  </div>
                </li>
              );
            })}
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
