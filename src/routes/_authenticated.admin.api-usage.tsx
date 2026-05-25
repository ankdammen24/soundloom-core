import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/admin/MetricCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { RangePicker, type Range } from "@/components/admin/RangePicker";
import { PageHeader } from "@/components/PageHeader";
import { Activity, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/api-usage")({
  head: () => ({ meta: [{ title: "API usage – Admin – Catalogus Musicus" }] }),
  component: ApiUsagePage,
});

type Row = { route: string; count: number; p95Ms?: number };
type Consumer = { id: string; label?: string; count: number };

function ApiUsagePage() {
  const [range, setRange] = useState<Range>("24h");
  const q = useQuery({
    queryKey: ["admin", "api-usage", range],
    queryFn: () => api.admin.apiUsage(range),
    retry: false,
  });
  const u = q.data;

  const routeCols: Column<Row>[] = [
    { key: "route", header: "Route", cell: (r) => <span className="font-mono text-xs">{r.route}</span> },
    { key: "count", header: "Requests", cell: (r) => r.count.toLocaleString() },
    { key: "p95", header: "p95", cell: (r) => r.p95Ms !== undefined ? `${r.p95Ms} ms` : "—" },
  ];
  const consumerCols: Column<Consumer>[] = [
    { key: "id", header: "Consumer", cell: (c) => <span className="font-mono text-xs">{c.label ?? c.id}</span> },
    { key: "count", header: "Requests", cell: (c) => c.count.toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="API usage"
        description="Request volume, latency and rate-limit pressure"
        actions={<RangePicker value={range} onChange={setRange} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total requests" icon={Activity} value={u?.totalRequests?.toLocaleString() ?? "—"} />
        <MetricCard label="Rate-limit hits" icon={ShieldAlert} tone={u?.rateLimitHits ? "warn" : "default"}
          value={u?.rateLimitHits ?? "—"} />
        <MetricCard label="Range" value={range} />
      </div>

      {u?.byStatus && (
        <div className="rounded-lg border bg-card p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Status codes</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(u.byStatus).map(([code, n]) => {
              const tone = code.startsWith("2") ? "border-emerald-500/30 text-emerald-500"
                : code.startsWith("4") ? "border-amber-500/30 text-amber-500"
                : code.startsWith("5") ? "border-destructive/40 text-destructive"
                : "border-border text-muted-foreground";
              return (
                <div key={code} className={`rounded-md border px-3 py-1.5 text-sm ${tone}`}>
                  <span className="font-mono font-semibold">{code}</span>
                  <span className="ml-2 text-muted-foreground">{n.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Top routes</h2>
          <DataTable
            columns={routeCols}
            rows={u?.byRoute as Row[] | undefined}
            isLoading={q.isLoading}
            error={q.error}
            expectedUrl="/api/admin/metrics/api-usage"
            emptyMessage="No traffic"
            rowKey={(r) => r.route}
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Top consumers</h2>
          <DataTable
            columns={consumerCols}
            rows={u?.topConsumers as Consumer[] | undefined}
            isLoading={q.isLoading}
            error={q.error}
            expectedUrl="/api/admin/metrics/api-usage"
            emptyMessage="No consumer data"
            rowKey={(c) => c.id}
          />
        </div>
      </div>
    </div>
  );
}
