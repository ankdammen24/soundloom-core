import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError, type LogEntry } from "@/lib/api";
import { JsonView } from "@/components/admin/JsonView";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Loader2, PlugZap, AlertTriangle, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Logs – Admin – Catalogus Musicus" }] }),
  component: LogsPage,
});

const LEVELS = ["", "debug", "info", "warn", "error"] as const;

function levelTone(l: string) {
  return l === "error" ? "text-destructive" : l === "warn" ? "text-amber-500" : l === "info" ? "text-sky-400" : "text-muted-foreground";
}

function LogsPage() {
  const [level, setLevel] = useState<string>("");
  const [service, setService] = useState("");
  const [text, setText] = useState("");
  const [tail, setTail] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "logs", level, service, text],
    queryFn: () => api.admin.logs({
      level: level || undefined,
      service: service || undefined,
      q: text || undefined,
      limit: 200,
    }),
    refetchInterval: tail ? 5_000 : false,
    retry: false,
  });

  const items = q.data?.items;
  const notFound = q.error instanceof ApiError && q.error.status === 404;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Logs"
        description="Structured application logs"
        actions={
          <Button size="sm" variant={tail ? "default" : "outline"} onClick={() => setTail((v) => !v)}>
            {tail ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
            {tail ? "Tailing" : "Paused"}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {LEVELS.map((l) => <option key={l} value={l}>{l || "all levels"}</option>)}
        </select>
        <input
          value={service}
          onChange={(e) => setService(e.target.value)}
          placeholder="service"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="search text or traceId"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm flex-1 min-w-[200px]"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : notFound ? (
          <div className="p-10 text-center text-muted-foreground">
            <PlugZap className="mx-auto mb-2 h-5 w-5" />
            Endpoint not yet available — expected at <span className="font-mono text-xs">/api/admin/logs</span>
          </div>
        ) : q.error ? (
          <div className="p-10 text-center text-destructive">
            <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
            {(q.error as Error).message}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No log entries</div>
        ) : (
          <div className="divide-y divide-border max-h-[70vh] overflow-auto font-mono text-xs">
            {items.map((e: LogEntry) => (
              <div key={e.id}>
                <button
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  className="w-full grid grid-cols-[auto_auto_auto_1fr] gap-3 items-center px-3 py-1.5 text-left hover:bg-muted/30"
                >
                  <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
                  <span className={cn("uppercase font-semibold", levelTone(e.level))}>{e.level}</span>
                  <span className="text-muted-foreground">{e.service ?? "—"}</span>
                  <span className="truncate">{e.message}</span>
                </button>
                {expanded === e.id && (
                  <div className="px-3 pb-3">
                    <JsonView data={{ traceId: e.traceId, ...e.fields }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
