import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { MetricCard } from "@/components/admin/MetricCard";
import {
  Activity, Cpu, Database, HardDrive, ListChecks, ScrollText, Stethoscope,
  ShieldAlert, Gauge, Layers, Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

const URL = "https://catalogusmusicus.mediarosenqvist.com/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin & Operations – Catalogus Musicus" },
      { name: "description", content: "Operational dashboard for workers, queues, storage, processing and audit logs." },
      { property: "og:title", content: "Admin – Catalogus Musicus" },
      { property: "og:description", content: "Operational tooling for the Catalogus Musicus platform." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: AdminLayout,
});

const subnav: ReadonlyArray<{ to: string; label: string; icon: typeof Gauge; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: Gauge, exact: true },
  { to: "/admin/workers", label: "Workers", icon: Server },
  { to: "/admin/queues", label: "Queues", icon: Layers },
  { to: "/admin/storage", label: "Storage", icon: HardDrive },
  { to: "/admin/processing-metrics", label: "Processing", icon: Cpu },
  { to: "/admin/jobs", label: "Failed jobs", icon: ListChecks },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
  { to: "/admin/diagnostics", label: "Diagnostics", icon: Stethoscope },
  { to: "/admin/audit", label: "Audit", icon: ShieldAlert },
  { to: "/admin/api-usage", label: "API usage", icon: Activity },
];

function AdminLayout() {
  const location = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to) && to !== "/admin";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Database className="h-4 w-4" /> Operations
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Admin & Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live operational telemetry, queue health, processing metrics and audit trails for the Catalogus Musicus backend.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {subnav.map((s) => {
          const active = s.exact ? location.pathname === s.to : location.pathname.startsWith(s.to);
          const Icon = s.icon;
          return (
            <Link
              key={s.to}
              to={s.to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </Link>
          );
        })}
      </nav>

      {location.pathname === "/admin" ? <AdminOverview /> : <Outlet />}
    </div>
  );
}

function fmtBytes(n?: number) {
  if (n === undefined || n === null) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function AdminOverview() {
  const q = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: () => api.admin.summary(),
    refetchInterval: 15_000,
    retry: false,
  });
  const s = q.data;
  const notFound = q.error instanceof ApiError && q.error.status === 404;

  return (
    <div className="space-y-4">
      {notFound && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
          Backend summary endpoint not live yet — expected at <span className="font-mono">/api/admin/summary</span>.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Workers" icon={Server} tone="ok"
          value={s ? `${s.workersUp ?? 0} / ${s.workersTotal ?? 0}` : "—"}
          hint="Online / total" />
        <MetricCard label="Queue depth" icon={Layers}
          value={s?.queueDepth ?? "—"}
          hint="Jobs waiting + active" />
        <MetricCard label="Failed jobs (24h)" icon={ListChecks} tone={s?.failedJobs24h ? "warn" : "default"}
          value={s?.failedJobs24h ?? "—"} />
        <MetricCard label="Storage used" icon={HardDrive}
          value={fmtBytes(s?.storageUsedBytes)}
          hint={s?.storageQuotaBytes ? `of ${fmtBytes(s.storageQuotaBytes)}` : undefined} />
        <MetricCard label="Processing p95" icon={Cpu}
          value={s?.processingP95Ms !== undefined ? `${s.processingP95Ms} ms` : "—"} />
        <MetricCard label="Requests / min" icon={Activity}
          value={s?.requestsPerMin ?? "—"} />
      </div>
    </div>
  );
}
