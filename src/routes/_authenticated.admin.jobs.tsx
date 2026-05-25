import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Job } from "@/lib/api";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { JsonView } from "@/components/admin/JsonView";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { RotateCw, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  head: () => ({ meta: [{ title: "Failed jobs – Admin – Catalogus Musicus" }] }),
  component: JobsPage,
});

function JobsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [queue, setQueue] = useState<string>("");

  const q = useQuery({
    queryKey: ["admin", "jobs", "failed", queue],
    queryFn: () => api.admin.failedJobs({ queue: queue || undefined, limit: 100 }),
    refetchInterval: 15_000,
    retry: false,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "jobs", "failed"] });

  const retry = useMutation({
    mutationFn: (id: string) => api.admin.retryJob(id),
    onSuccess: () => { toast.success("Retry queued"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const discard = useMutation({
    mutationFn: (id: string) => api.admin.discardJob(id),
    onSuccess: () => { toast.success("Discarded"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bulkRetry = useMutation({
    mutationFn: (ids: string[]) => api.admin.bulkRetry(ids),
    onSuccess: () => { toast.success(`Retried ${selected.size} jobs`); setSelected(new Set()); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data?.items;
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: Column<Job>[] = [
    {
      key: "sel", header: "", className: "w-8",
      cell: (j) => (
        <input type="checkbox" checked={selected.has(j.id)}
          onChange={(e) => { e.stopPropagation(); toggle(j.id); }}
          onClick={(e) => e.stopPropagation()} />
      ),
    },
    {
      key: "id", header: "ID",
      cell: (j) => (
        <button className="flex items-center gap-1 font-mono text-xs">
          {expanded === j.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {j.id}
        </button>
      ),
    },
    { key: "queue", header: "Queue", cell: (j) => j.queue },
    { key: "type", header: "Type", cell: (j) => j.type ?? "—" },
    { key: "att", header: "Attempts", cell: (j) => `${j.attempts ?? 0}/${j.maxAttempts ?? "∞"}` },
    { key: "err", header: "Error", cell: (j) => <span className="text-destructive text-xs line-clamp-1">{j.error ?? "—"}</span> },
    { key: "ts", header: "Failed at", cell: (j) => j.failedAt ? new Date(j.failedAt).toLocaleString() : "—" },
    {
      key: "act", header: "",
      cell: (j) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => retry.mutate(j.id)} disabled={retry.isPending}>
            <RotateCw className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => discard.mutate(j.id)} disabled={discard.isPending}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Failed jobs"
        description="Inspect, retry or discard failed background jobs"
        actions={
          <div className="flex gap-2">
            <input
              value={queue}
              onChange={(e) => setQueue(e.target.value)}
              placeholder="Filter by queue"
              className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
            />
            <Button
              size="sm"
              disabled={selected.size === 0 || bulkRetry.isPending}
              onClick={() => bulkRetry.mutate(Array.from(selected))}
            >
              <RotateCw className="h-3.5 w-3.5 mr-1" /> Retry {selected.size || ""}
            </Button>
          </div>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        isLoading={q.isLoading}
        error={q.error}
        expectedUrl="/api/admin/jobs/failed"
        emptyMessage="No failed jobs 🎉"
        rowKey={(j) => j.id}
        onRowClick={(j) => setExpanded((e) => (e === j.id ? null : j.id))}
      />
      {expanded && rows && (() => {
        const job = rows.find((r) => r.id === expanded);
        return job ? (
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job payload — {job.id}</div>
            <JsonView data={job.payload} />
            {job.error && (
              <>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-3">Error</div>
                <JsonView data={job.error} />
              </>
            )}
          </div>
        ) : null;
      })()}
    </div>
  );
}
