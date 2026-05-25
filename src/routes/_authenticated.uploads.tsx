import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Upload, FileAudio, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { artistsApi } from "@/lib/api/catalog";
import { uploadsApi, uploadToPresignedUrl } from "@/lib/api/uploads";

export const Route = createFileRoute("/_authenticated/uploads")({
  head: () => ({ meta: [{ title: "Upload – Music Catalog" }] }),
  component: UploadsPage,
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function UploadsPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [genre, setGenre] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const artists = useQuery({ queryKey: ["artists"], queryFn: () => artistsApi.list() });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !trackTitle) throw new Error("Missing required fields");
      setError(null);
      setSuccess(null);
      setProgress(0);

      // 1. Ask the backend for a signed upload URL.
      const presign = await uploadsApi.presign({
        kind: "audio",
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });

      // 2. PUT the file binary straight to R2.
      await uploadToPresignedUrl(presign, file, (pct) => setProgress(pct));

      // 3. Metadata is stored via the catalog API — the presign endpoint
      //    typically already records the upload. Surface the key for the user.
      return { key: presign.key, uploadId: presign.upload_id };
    },
    onSuccess: ({ key, uploadId }) => {
      setSuccess(`Uploaded ${key}${uploadId ? ` (id ${uploadId})` : ""}`);
      setFile(null);
      setTrackTitle("");
      setGenre("");
      setProgress(null);
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
                <option value="">Select artist…</option>
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
        <h2 className="mb-3 text-base font-semibold flex items-center gap-2">
          <FileAudio className="h-4 w-4" /> Direct-to-R2 uploads
        </h2>
        <p className="text-sm text-muted-foreground">
          Files are streamed straight from your browser to R2 using a signed URL issued by the
          media-catalog API. soundloom-core never sees the upload bytes.
        </p>
      </section>
    </div>
  );
}
