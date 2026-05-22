import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/admin/MetricCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { RangePicker, type Range } from "@/components/admin/RangePicker";
import { PageHeader } from "@/components/PageHeader";
import { Cpu, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/processing-metrics")({
  head: () => ({ meta: [{ title: "Processing metrics – Admin – Catalogus Musicus" }] }),
  component: ProcessingPage,
});

type Row = { type: string; throughput?: number; successRate?: number; p50Ms?: number; p95Ms?: number; p99Ms?: number };

function ProcessingPage() {
  const [range, setRange] = useState<Range>("24h");
  const q = useQuery({
    queryKey: ["admin", "processing", range],
    queryFn: () => api.admin.processing(range),
    retry: false,
  });
  const m = q.data;

  const columns: Column<Row>[] = [
    { key: "type", header: "Job type", cell: (r) => <span className="font-medium">{r.type}</span> },
    { key: "tp", header: "Throughput/min", cell: (r) => r.throughput?.toFixed(1) ?? "—" },
    { key: "sr", header: "Success", cell: (r) => r.successRate !== undefined ? `${(r.successRate * 100).toFixed(1)}%` : "—" },
    { key: "p50", header: "p50", cell: (r) => r.p50Ms !== undefined ? `${r.p50Ms} ms` : "—" },
    { key: "p95", header: "p95", cell: (r) => r.p95Ms !== undefined ? `${r.p95Ms} ms` : "—" },
    { key: "p99", header: "p99", cell: (r) => r.p99Ms !== undefined ? `${r.p99Ms} ms` : "—" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Processing metrics"
        description="Job throughput, success rate and latency percentiles"
        actions={<RangePicker value={range} onChange={setRange} />}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Throughput / min" icon={Cpu} value={m?.throughputPerMin?.toFixed(1) ?? "—"} />
        <MetricCard label="Success rate" icon={CheckCircle2} tone="ok"
          value={m?.successRate !== undefined ? `${(m.successRate * 100).toFixed(2)}%` : "—"} />
        <MetricCard label="Range" value={range} />
      </div>
      <DataTable
        columns={columns}
        rows={m?.byType as Row[] | undefined}
        isLoading={q.isLoading}
        error={q.error}
        expectedUrl="/api/admin/metrics/processing"
        emptyMessage="No job types reported"
        rowKey={(r) => r.type}
      />
    </div>
  );
}
