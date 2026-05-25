import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type StorageStats } from "@/lib/api";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/admin/storage")({
  head: () => ({ meta: [{ title: "Storage – Admin – Catalogus Musicus" }] }),
  component: StoragePage,
});

function fmtBytes(n?: number) {
  if (n === undefined || n === null) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

function UsageBar({ used, quota }: { used?: number; quota?: number }) {
  if (!used || !quota) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = Math.min(100, (used / quota) * 100);
  const tone = pct > 90 ? "bg-destructive" : pct > 75 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="w-32">
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">{pct.toFixed(1)}%</div>
    </div>
  );
}

function StoragePage() {
  const q = useQuery({
    queryKey: ["admin", "storage"],
    queryFn: () => api.admin.storage(),
    refetchInterval: 30_000,
    retry: false,
  });

  const columns: Column<StorageStats>[] = [
    { key: "name", header: "Bucket", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "used", header: "Used", cell: (r) => fmtBytes(r.usedBytes) },
    { key: "quota", header: "Quota", cell: (r) => fmtBytes(r.quotaBytes) },
    { key: "bar", header: "Usage", cell: (r) => <UsageBar used={r.usedBytes} quota={r.quotaBytes} /> },
    { key: "objects", header: "Objects", cell: (r) => r.objectCount?.toLocaleString() ?? "—" },
    { key: "egress", header: "Egress 24h", cell: (r) => fmtBytes(r.egress24hBytes) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Storage" description="Bucket utilization and egress" />
      <DataTable
        columns={columns}
        rows={q.data}
        isLoading={q.isLoading}
        error={q.error}
        expectedUrl="/api/admin/storage"
        emptyMessage="No buckets reported"
        rowKey={(r) => r.name}
      />
    </div>
  );
}
