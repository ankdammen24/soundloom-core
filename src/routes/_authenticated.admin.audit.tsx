import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, type AuditEvent } from "@/lib/api";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { JsonView } from "@/components/admin/JsonView";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit log – Admin – Catalogus Musicus" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "audit", actor, action, resourceType],
    queryFn: () => api.admin.audit({
      actor: actor || undefined,
      action: action || undefined,
      resourceType: resourceType || undefined,
      limit: 100,
    }),
    refetchInterval: 30_000,
    retry: false,
  });

  const rows = q.data?.items;

  const columns: Column<AuditEvent>[] = [
    { key: "ts", header: "Time", cell: (e) => new Date(e.ts).toLocaleString() },
    { key: "actor", header: "Actor", cell: (e) => <span className="font-mono text-xs">{e.actor ?? "—"}</span> },
    { key: "action", header: "Action", cell: (e) => <span className="font-medium">{e.action}</span> },
    { key: "res", header: "Resource", cell: (e) => `${e.resourceType ?? "—"}${e.resourceId ? ` · ${e.resourceId}` : ""}` },
    { key: "ip", header: "IP", cell: (e) => <span className="font-mono text-xs">{e.ip ?? "—"}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Audit log" description="Chronological record of admin and system actions" />

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="actor"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="action"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
        <input value={resourceType} onChange={(e) => setResourceType(e.target.value)} placeholder="resource type"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={q.isLoading}
        error={q.error}
        expectedUrl="/api/admin/audit"
        emptyMessage="No audit events"
        rowKey={(e) => e.id}
        onRowClick={(e) => setExpanded(expanded === e.id ? null : e.id)}
      />

      {expanded && rows && (() => {
        const e = rows.find((r) => r.id === expanded);
        return e ? (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Before</div>
            <JsonView data={e.before ?? null} />
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">After</div>
            <JsonView data={e.after ?? null} />
          </div>
        ) : null;
      })()}
    </div>
  );
}
