import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError, type HealthStatus } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle2, AlertTriangle, Loader2, ServerCog, Database, HardDrive, KeyRound, Cpu } from "lucide-react";
import type { ComponentType } from "react";

const URL = "https://catalog.mediarosenqvist.com/status";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Platform Status – Soundloom" },
      { name: "description", content: "Live health status for the Soundloom music catalog backend — database, storage and integration checks." },
      { property: "og:title", content: "Platform Status – Soundloom" },
      { property: "og:description", content: "Backend and integration health for the Soundloom music catalog." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: StatusPage,
});


type Check = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  fn: () => Promise<HealthStatus>;
};

const CHECKS: Check[] = [
  { id: "api", label: "API", icon: ServerCog, fn: api.health },
  { id: "database", label: "Database", icon: Database, fn: api.healthDatabase },
  { id: "storage", label: "Storage", icon: HardDrive, fn: api.healthStorage },
  { id: "auth", label: "Auth", icon: KeyRound, fn: api.healthAuth },
  { id: "redis", label: "Redis", icon: Cpu, fn: api.healthRedis },
];

function StatusPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Status"
        description={`Live checks against ${import.meta.env.VITE_API_BASE_URL ?? "(VITE_API_BASE_URL not set)"}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHECKS.map((c) => <StatusCard key={c.id} check={c} />)}
      </div>
    </div>
  );
}

function StatusCard({ check }: { check: Check }) {
  const q = useQuery({
    queryKey: ["health", check.id],
    queryFn: check.fn,
    refetchInterval: 30_000,
    retry: false,
  });
  const Icon = check.icon;

  const state: "loading" | "ok" | "err" = q.isLoading ? "loading" : q.error ? "err" : "ok";
  const tone =
    state === "ok" ? "border-emerald-500/30 bg-emerald-500/5"
    : state === "err" ? "border-destructive/40 bg-destructive/5"
    : "border-border bg-card";

  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{check.label}</span>
        </div>
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {state === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        {state === "err" && <AlertTriangle className="h-4 w-4 text-destructive" />}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {state === "loading" && "Checking…"}
        {state === "ok" && (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px]">
            {JSON.stringify(q.data, null, 2)}
          </pre>
        )}
        {state === "err" && (
          <div className="text-destructive">
            {q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error)?.message ?? "Failed"}
          </div>
        )}
      </div>
    </div>
  );
}
