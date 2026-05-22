import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Upload } from "lucide-react";

const URL = "https://catalogusmusicus.mediarosenqvist.com/assets";

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Assets – Catalogus Musicus" },
      { name: "description", content: "Browse and manage audio, artwork and document assets in the Catalogus Musicus catalog." },
      { property: "og:title", content: "Assets – Catalogus Musicus" },
      { property: "og:description", content: "Audio, artwork and document assets for the modern music catalog and distribution platform." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Catalog</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Assets</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Audio masters, cover artwork and supporting documents. The asset browser is on its way — head to Uploads to add new files in the meantime.
          </p>
        </div>
        <Link
          to="/uploads"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" /> Upload
        </Link>
      </header>

      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
        <Boxes className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Asset library coming soon.</p>
      </div>
    </div>
  );
}
