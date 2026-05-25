import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

const URL = "https://catalogusmusicus.mediarosenqvist.com/organizations";

export const Route = createFileRoute("/_authenticated/organizations")({
  head: () => ({
    meta: [
      { title: "Organizations – Catalogus Musicus" },
      { name: "description", content: "Manage labels, imprints and rights holders across the Catalogus Musicus catalog." },
      { property: "og:title", content: "Organizations – Catalogus Musicus" },
      { property: "og:description", content: "Labels, imprints and rights holders for the modern music catalog and distribution platform." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: OrganizationsPage,
});

function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Labels, imprints and rights holders. Multi-org management is on the roadmap.
        </p>
      </header>

      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Organization management coming soon.</p>
      </div>
    </div>
  );
}
