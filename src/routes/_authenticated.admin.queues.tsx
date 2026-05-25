import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type QueueStats } from "@/lib/api";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/admin/queues")({
  head: () => ({ meta: [{ title: "Queues – Admin – Catalogus Musicus" }] }),
  component: QueuesPage,
});

function Sparkline({ values }: { values?: number[] }) {
  if (!values || values.length < 2) return <span className="text-muted-foreground text-xs">—</span>;
  const max = Math.max(...values, 1);
  const w = 80; const h = 24;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="text-primary">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

function QueuesPage() {
  const q = useQuery({
    queryKey: ["admin", "queues"],
    queryFn: () => api.admin.queues(),
    refetchInterval: 10_000,
    retry: false,
  });

  const columns: Column<QueueStats>[] = [
    { key: "name", header: "Queue", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "waiting", header: "Waiting", cell: (r) => r.waiting ?? 0 },
    { key: "active", header: "Active", cell: (r) => r.active ?? 0 },
    { key: "completed", header: "Completed", cell: (r) => r.completed ?? 0 },
    { key: "failed", header: "Failed", cell: (r) => <span className={r.failed ? "text-destructive font-medium" : ""}>{r.failed ?? 0}</span> },
    { key: "delayed", header: "Delayed", cell: (r) => r.delayed ?? 0 },
    { key: "paused", header: "Paused", cell: (r) => r.paused ? "Yes" : "No" },
    { key: "trend", header: "Trend", cell: (r) => <Sparkline values={r.history} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Queues" description="Per-queue depth and throughput" />
      <DataTable
        columns={columns}
        rows={q.data}
        isLoading={q.isLoading}
        error={q.error}
        expectedUrl="/api/admin/queues"
        emptyMessage="No queues configured"
        rowKey={(r) => r.name}
      />
    </div>
  );
}
