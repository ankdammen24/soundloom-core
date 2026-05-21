import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/releases/$id")({
  head: () => ({ meta: [{ title: "Release – Soundloom" }] }),
  component: ReleaseDetail,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return <div className="space-y-2 p-4"><p className="text-sm text-destructive">{error.message}</p>
      <button className="rounded border px-3 py-1 text-sm" onClick={() => { router.invalidate(); reset(); }}>Retry</button></div>;
  },
});

function ReleaseDetail() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["releases", id], queryFn: () => api.getRelease(id), retry: false });
  return (
    <div className="space-y-6">
      <Link to="/releases" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Releases
      </Link>
      {q.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      )}
      {q.data && (
        <>
          <PageHeader title={q.data.title} description={q.data.type ?? ""} />
          <pre className="rounded-md border border-border bg-card p-4 text-xs overflow-auto">{JSON.stringify(q.data, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
