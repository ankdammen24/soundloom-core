import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/auth/guards";

export const Route = createFileRoute("/_authenticated/api-keys")({
  beforeLoad: ({ location }) => {
    requireRole(["admin"], { href: location.href });
  },
  head: () => ({ meta: [{ title: "API access – Admin" }] }),
  component: ApiAccessPage,
});

const PLANNED_SCOPES = [
  { name: "catalog:read", desc: "Read artists, releases and tracks." },
  { name: "catalog:write", desc: "Create or update catalog entries." },
  { name: "files:read", desc: "Generate signed URLs for masters and artwork." },
  { name: "files:write", desc: "Upload new masters and artwork." },
];

function ApiAccessPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="API access"
        description="External API access for partner platforms."
      />

      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <KeyRound className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">API key management is planned</h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Key generation, rotation and scope enforcement will land once the public
              catalog API surface is stable. Until then, all access goes through the
              authenticated admin UI.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Planned scopes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keys will be issued with one or more of the following scopes.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {PLANNED_SCOPES.map((s) => (
            <li key={s.name} className="flex items-center gap-3 px-5 py-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <code className="text-sm font-mono">{s.name}</code>
              <span className="text-sm text-muted-foreground">— {s.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
