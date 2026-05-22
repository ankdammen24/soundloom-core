import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";

const URL = "https://catalogusmusicus.mediarosenqvist.com/distribution";

export const Route = createFileRoute("/distribution")({
  head: () => ({
    meta: [
      { title: "Distribution – Catalogus Musicus" },
      { name: "description", content: "Deliver releases to streaming services and partners from the Catalogus Musicus catalog." },
      { property: "og:title", content: "Distribution – Catalogus Musicus" },
      { property: "og:description", content: "Modern music distribution to streaming services and partners." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: DistributionPage,
});

function DistributionPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Distribution</h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Push releases to streaming services and partners. Delivery pipelines are being wired up.
        </p>
      </header>

      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
        <Radio className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Distribution channels coming soon.</p>
      </div>
    </div>
  );
}
