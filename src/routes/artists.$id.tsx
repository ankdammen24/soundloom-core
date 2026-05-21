import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/artists/$id")({
  head: () => ({ meta: [{ title: "Artist – Soundloom" }] }),
  component: ArtistDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-destructive">{error.message}</p>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => { router.invalidate(); reset(); }}>
          Retry
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-4 text-sm">Artist not found.</div>,
});

function ArtistDetail() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["artists", id], queryFn: () => api.getArtist(id), retry: false });
  return (
    <div className="space-y-6">
      <Link to="/artists" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Artists
      </Link>
      {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>
            {q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}
          </div>
        </div>
      )}
      {q.data && (
        <>
          <PageHeader title={q.data.displayName ?? q.data.display_name ?? q.data.name ?? "Artist"} description={q.data.country ?? ""} />
          <pre className="rounded-md border border-border bg-card p-4 text-xs overflow-auto">
            {JSON.stringify(q.data, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
