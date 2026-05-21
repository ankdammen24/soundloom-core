import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, apiUrl, API_BASE_URL, ApiError, type HealthStatus } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Loader2, ServerCog, Database, HardDrive, KeyRound, Cpu, Play } from "lucide-react";
import type { ComponentType } from "react";

const URL = "https://soundloom.mediarosenqvist.com/status";

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
  const resolvedBase = API_BASE_URL || "(VITE_API_BASE_URL not set)";
  const healthUrl = apiUrl("/health");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Status"
        description={`Live checks against ${resolvedBase}`}
      />

      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Debug — resolved env</div>
        <div className="grid gap-1 font-mono text-xs">
          <div><span className="text-muted-foreground">VITE_API_BASE_URL:</span> {resolvedBase}</div>
          <div><span className="text-muted-foreground">/health URL:</span> {healthUrl}</div>
          <div><span className="text-muted-foreground">MODE:</span> {import.meta.env.MODE}</div>
        </div>
      </div>

      <FetchTest />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHECKS.map((c) => <StatusCard key={c.id} check={c} />)}
      </div>
    </div>
  );
}

function FetchTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: string;
    error?: string;
  } | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    const url = apiUrl("/health");
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k] = v; });
      const body = await res.text();
      setResult({ status: res.status, statusText: res.statusText, headers, body });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isCors = /CORS|Cross-Origin|preflight/i.test(msg);
      setResult({
        error: isCors
          ? `CORS error calling ${url}. Backend must allow this origin (${window.location.origin}).`
          : `Network error calling ${url}: ${msg}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Raw fetch test</div>
          <div className="text-xs text-muted-foreground">Calls {apiUrl("/health")} directly and shows status, headers and body.</div>
        </div>
        <Button onClick={run} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          <span className="ml-2">Run /health</span>
        </Button>
      </div>
      {result && (
        <div className="space-y-2 text-xs">
          {result.error ? (
            <div className="text-destructive">{result.error}</div>
          ) : (
            <>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className={result.status && result.status < 400 ? "text-emerald-500" : "text-destructive"}>
                  {result.status} {result.statusText}
                </span>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Headers</div>
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-muted/40 rounded p-2">
                  {JSON.stringify(result.headers, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Body</div>
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-muted/40 rounded p-2">
                  {result.body || "(empty)"}
                </pre>
              </div>
            </>
          )}
        </div>
      )}
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
