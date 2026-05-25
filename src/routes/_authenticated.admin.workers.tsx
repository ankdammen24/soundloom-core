import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, apiUrl, type Worker } from "@/lib/api";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/admin/workers")({
  head: () => ({ meta: [{ title: "Workers – Admin – Catalogus Musicus" }] }),
  component: WorkersPage,
});

function StatusBadge({ status }: { status?: string }) {
  const tone =
    status === "online" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" :
    status === "degraded" ? "bg-amber-500/15 text-amber-500 border-amber-500/30" :
    status === "offline" ? "bg-destructive/15 text-destructive border-destructive/30" :
    "bg-muted text-muted-foreground border-border";
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>{status ?? "unknown"}</span>;
}

function WorkersPage() {
  const ar = useAutoRefresh(10_000);
  const q = useQuery({
    queryKey: ["admin", "workers"],
    queryFn: () => api.admin.workers(),
    refetchInterval: ar.refetchInterval,
    retry: false,
  });

  const columns: Column<Worker>[] = [
    { key: "id", header: "ID", cell: (w) => <span className="font-mono text-xs">{w.id}</span> },
    { key: "host", header: "Host", cell: (w) => w.host ?? "—" },
    { key: "version", header: "Version", cell: (w) => <span className="font-mono text-xs">{w.version ?? "—"}</span> },
    { key: "status", header: "Status", cell: (w) => <StatusBadge status={w.status} /> },
    { key: "active", header: "Active jobs", cell: (w) => w.activeJobs ?? 0 },
    { key: "hb", header: "Last heartbeat", cell: (w) => w.lastHeartbeat ? new Date(w.lastHeartbeat).toLocaleTimeString() : "—" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Workers" description={`Polling ${apiUrl("/api/admin/workers")}`} />
      <DataTable
        columns={columns}
        rows={q.data}
        isLoading={q.isLoading}
        error={q.error}
        expectedUrl="/api/admin/workers"
        emptyMessage="No workers registered"
        rowKey={(w) => w.id}
      />
    </div>
  );
}
