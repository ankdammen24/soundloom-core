import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL, ApiError } from "@/lib/api";
import { JsonView } from "@/components/admin/JsonView";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/diagnostics")({
  head: () => ({ meta: [{ title: "Diagnostics – Admin – Catalogus Musicus" }] }),
  component: DiagPage,
});

const SUBSYSTEMS = [
  { id: "api", fn: api.health },
  { id: "database", fn: api.healthDatabase },
  { id: "storage", fn: api.healthStorage },
  { id: "auth", fn: api.healthAuth },
  { id: "redis", fn: api.healthRedis },
] as const;

function DiagPage() {
  const agg = useQuery({
    queryKey: ["admin", "health-all"],
    queryFn: () => api.admin.healthAll(),
    retry: false,
    refetchInterval: 30_000,
  });

  const useFallback = agg.error instanceof ApiError && agg.error.status === 404;

  const fallback = useQuery({
    queryKey: ["admin", "diag-fallback"],
    enabled: useFallback,
    queryFn: async () => {
      const results = await Promise.allSettled(SUBSYSTEMS.map((s) => s.fn()));
      return Object.fromEntries(SUBSYSTEMS.map((s, i) => {
        const r = results[i];
        return [s.id, r.status === "fulfilled" ? r.value : { status: "error", error: (r.reason as Error)?.message }];
      }));
    },
    refetchInterval: 30_000,
  });

  const checks: Record<string, unknown> | undefined = agg.data?.checks ?? fallback.data;

  function copyReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      env: {
        VITE_API_BASE_URL: API_BASE_URL,
        MODE: import.meta.env.MODE,
        origin: typeof window !== "undefined" ? window.location.origin : null,
      },
      health: agg.data ?? { fallback: true, checks: fallback.data },
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    toast.success("Diagnostics report copied");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="System diagnostics"
        description="Aggregated health checks across all subsystems"
        actions={<Button size="sm" variant="outline" onClick={copyReport}><Copy className="h-3.5 w-3.5 mr-1" /> Copy report</Button>}
      />

      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Environment</div>
        <div className="grid gap-1 font-mono text-xs">
          <div><span className="text-muted-foreground">API:</span> {API_BASE_URL || "(not configured)"}</div>
          <div><span className="text-muted-foreground">Mode:</span> {import.meta.env.MODE}</div>
          <div><span className="text-muted-foreground">Origin:</span> {typeof window !== "undefined" ? window.location.origin : "—"}</div>
        </div>
      </div>

      {useFallback && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400">
          Aggregate <span className="font-mono">/health/all</span> not available. Falling back to per-subsystem checks.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(agg.isLoading || (useFallback && fallback.isLoading)) ? (
          <div className="col-span-full p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : checks ? (
          Object.entries(checks).map(([name, val]) => {
            const v = val as { status?: string };
            const ok = v?.status === "ok" || v?.status === "healthy";
            return (
              <div key={name} className={`rounded-lg border p-4 ${ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{name}</span>
                  {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>
                <div className="mt-2"><JsonView data={val} /></div>
              </div>
            );
          })
        ) : agg.error && !useFallback ? (
          <div className="col-span-full rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive text-sm">
            {(agg.error as Error).message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
