import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Upload, FileAudio, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

export const Route = createFileRoute("/_authenticated/uploads")({
  head: () => ({ meta: [{ title: "Upload – Music Catalog" }] }),
  component: UploadsPage,
});

type Artist = { id: string; name: string };
type UploadRow = {
  id: string;
  track_title: string;
  status: string;
  created_at: string;
  rejection_reason: string | null;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function UploadsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [genre, setGenre] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const artists = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data } = await supabase.from("artists").select("id, name").order("name");
      return (data ?? []) as Artist[];
    },
  });

  const myUploads = useQuery({
    queryKey: ["my-uploads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uploads")
        .select("id, track_title, status, created_at, rejection_reason")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as UploadRow[];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !trackTitle || !user) throw new Error("Missing required fields");
      setError(null);
      setSuccess(null);
      setProgress(0);

      // 1. Insert uploads row (status=uploaded)
      const { data: uploadRow, error: insertError } = await supabase
        .from("uploads")
        .insert({
          track_title: trackTitle,
          artist_id: artistId || null,
          genre: genre || null,
          status: "uploaded",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (insertError || !uploadRow) throw insertError ?? new Error("Could not create upload");

      const uploadId = uploadRow.id;
      const path = `${user.id}/${uploadId}/${file.name}`;

      // 2. Upload binary to storage
      setProgress(20);
      const { error: storageError } = await supabase.storage
        .from("audio-uploads")
        .upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (storageError) throw storageError;
      setProgress(80);

      // 3. Insert audio_files row (no RLS insert allowed for users — skip; processing job covers stub)
      // 4. Insert processing_jobs row — also restricted; left for editor/admin via server-side later.
      // For now the upload itself is the artifact; the processing_job will be created in a later phase.

      setProgress(100);
      return uploadId;
    },
    onSuccess: (id) => {
      setSuccess(`Upload created (${id})`);
      setFile(null);
      setTrackTitle("");
      setGenre("");
      setProgress(null);
      qc.invalidateQueries({ queryKey: ["my-uploads"] });
    },
    onError: (e: Error) => {
      setError(e.message);
      setProgress(null);
    },
  });

  const canUpload = (user?.roles ?? []).some((r) => ["admin", "editor", "artist"].includes(r));

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Upload audio"
        description="Upload a master audio file. It enters the review queue."
      />

      {!canUpload && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
          You need the <code>artist</code>, <code>editor</code>, or <code>admin</code> role to
          upload.
        </div>
      )}

      {canUpload && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            upload.mutate();
          }}
          className="space-y-4 rounded-lg border border-border bg-card p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Track title *
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Artist</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
              >
                <option value="">—</option>
                {(artists.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Genre</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Audio file *
              </label>
              <input
                type="file"
                accept="audio/*,.wav,.flac,.mp3,.m4a,.aiff"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="w-full text-sm"
              />
              {file && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {file.name} · {formatBytes(file.size)}
                </div>
              )}
            </div>
          </div>

          {progress !== null && (
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          <Btn type="submit" disabled={!file || !trackTitle || upload.isPending}>
            <Upload className="h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload"}
          </Btn>
        </form>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold">Recent uploads</h2>
        {myUploads.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!myUploads.isLoading && (myUploads.data ?? []).length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            <FileAudio className="mx-auto h-6 w-6 mb-2" /> No uploads yet.
          </div>
        )}
        {(myUploads.data ?? []).length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(myUploads.data ?? []).map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.track_title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{u.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.rejection_reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
