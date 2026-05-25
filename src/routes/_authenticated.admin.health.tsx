import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { CheckCircle2, XCircle, RefreshCw, Activity, Database, HardDrive } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { API_BASE_URL } from "@/lib/api/client";
import { healthApi, type HealthStatus } from "@/lib/api/health";

export const Route = createFileRoute("/_authenticated/admin/health")({
  beforeLoad: ({ location }) => {
    requireRole(["admin"], { href: location.href });
  },
  head: () => ({ meta: [{ title: "API health – Admin" }] }),
  component: HealthPage,
});

function StatusRow({
  icon: Icon,
  label,
  query,
}: {
  icon: typeof Activity;
  label: string;
  query: { data?: HealthStatus; isFetching: boolean; refetch: () => void };
}) {
  const s = query.data;
  const ok = s?.ok ?? false;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground truncate">
          {query.isFetching
            ? "Checking…"
            : s
              ? `${s.status ?? (ok ? "ok" : "down")} · ${s.latency_ms ?? "?"} ms`
              : "—"}
        </div>
      </div>
      <span
        className={
          "inline-flex items-center gap-1 text-sm " +
          (ok ? "text-success" : "text-destructive")
        }
      >
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {ok ? "Healthy" : "Down"}
      </span>
      <Btn variant="ghost" onClick={() => query.refetch()} disabled={query.isFetching}>
        <RefreshCw className={"h-4 w-4 " + (query.isFetching ? "animate-spin" : "")} />
      </Btn>
    </div>
  );
}

function HealthPage() {
  const apiQ = useQuery({
    queryKey: ["health", "api"],
    queryFn: () => healthApi.api(),
    refetchInterval: 30_000,
  });
  const storageQ = useQuery({
    queryKey: ["health", "storage"],
    queryFn: () => healthApi.storage(),
    refetchInterval: 30_000,
  });
  const dbQ = useQuery({
    queryKey: ["health", "database"],
    queryFn: () => healthApi.database(),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="API health"
        description="Live status of the media-catalog backend services."
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          API base URL
        </div>
        <code className="mt-1 block text-sm break-all">{API_BASE_URL}</code>
      </div>

      <div className="space-y-3">
        <StatusRow icon={Activity} label="API · /health" query={apiQ} />
        <StatusRow icon={HardDrive} label="Storage · /health/storage" query={storageQ} />
        <StatusRow icon={Database} label="Database · /health/database" query={dbQ} />
      </div>
    </div>
  );
}
