import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError, type Artist } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Artwork } from "@/components/media/Artwork";
import { EditableField } from "@/components/EditableField";
import { DetailSkeleton } from "@/components/Skeleton";
import { useOptimisticPatch } from "@/hooks/useOptimisticList";
import { ArrowLeft, AlertTriangle } from "lucide-react";

function artistName(a: Artist) {
  return a.displayName ?? a.display_name ?? a.name ?? "Artist";
}

export const Route = createFileRoute("/artists/$id")({
  head: () => ({ meta: [{ title: "Artist – Catalogus Musicus" }] }),
  component: ArtistDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-destructive">{error.message}</p>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => { router.invalidate(); reset(); }}>Retry</button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-4 text-sm">Artist not found.</div>,
});

function ArtistDetail() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["artists", id], queryFn: () => api.getArtist(id), retry: false });
  const patch = useOptimisticPatch<Artist>(["artists"], ["artists", id], (body) => api.updateArtist(id, body));

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Link to="/artists" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Artists
        </Link>
        <DetailSkeleton />
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="space-y-4">
        <Link to="/artists" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Artists
        </Link>
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      </div>
    );
  }
  if (!q.data) return null;
  const a = q.data;
  return (
    <div className="space-y-6">
      <Link to="/artists" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Artists
      </Link>
      <div className="flex flex-col sm:flex-row gap-6">
        <Artwork src={a.imageUrl ?? a.image_url} seed={a.id + artistName(a)} size="lg" alt={artistName(a)} />
        <div className="flex-1">
          <PageHeader title={artistName(a)} description={a.country ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
        <EditableField label="Name" value={a.name} onSave={(v) => patch.mutateAsync({ name: v })} />
        <EditableField label="Display name" value={a.displayName ?? a.display_name} onSave={(v) => patch.mutateAsync({ displayName: v })} />
        <EditableField label="Country" value={a.country} onSave={(v) => patch.mutateAsync({ country: v })} placeholder="SE" />
      </div>
    </div>
  );
}
