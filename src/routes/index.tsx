import { createFileRoute, Link } from "@tanstack/react-router";

const URL = "https://catalog.mediarosenqvist.com/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soundloom – Media Rosenqvist Music Catalog" },
      { name: "description", content: "Soundloom is the catalog and upload interface for Media Rosenqvist — manage artists, releases and tracks across Radio Core, Music Core and Radio Uppsala." },
      { property: "og:title", content: "Soundloom – Media Rosenqvist Music Catalog" },
      { property: "og:description", content: "Catalog and upload interface for Media Rosenqvist — artists, releases and tracks across radio and music services." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Soundloom</h1>
      <p className="text-muted-foreground">Frontend för Media Rosenqvists musikkatalog — bygger på music-catalog-core.</p>
      <div className="flex flex-wrap gap-2">
        {["discover", "releases", "artists", "tracks"].map((p) => (
          <Link key={p} to={`/${p}`} className="rounded border px-3 py-2">/{p}</Link>
        ))}
      </div>
    </div>
  );
}
