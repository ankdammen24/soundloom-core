import { createFileRoute, Link } from "@tanstack/react-router";

const CANONICAL_URL = "https://catalogusmusicus.mediarosenqvist.com/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Catalogus Musicus – Media Rosenqvist Music Catalog" },
      {
        name: "description",
        content:
          "Catalogus Musicus is the public catalog for Media Rosenqvist — browse artists, releases and tracks across Radio Core, Music Core and Radio Uppsala.",
      },
      { property: "og:title", content: "Catalogus Musicus – Media Rosenqvist Music Catalog" },
      {
        property: "og:description",
        content:
          "Public catalog for Media Rosenqvist — artists, releases and tracks across radio and music services.",
      },
      { property: "og:url", content: CANONICAL_URL },
    ],
    links: [{ rel: "canonical", href: CANONICAL_URL }],
  }),
  component: Home,
});

function Home() {
  const shortcuts = [
    { to: "/catalog", label: "Catalog", desc: "Browse all tracks" },
    { to: "/admin", label: "Admin", desc: "Sign in to manage" },
  ];
  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl p-8 md:p-12"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Catalogus Musicus
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">
            Media Rosenqvist Music Catalog
          </h1>
          <p className="mt-3 text-base text-foreground/80">
            Public catalog interface for Media Rosenqvist — artists, releases and tracks.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Quick links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group relative overflow-hidden rounded-xl bg-secondary p-5 transition-all hover:bg-accent hover:-translate-y-0.5"
            >
              <div className="text-base font-semibold">{s.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
              <div className="absolute right-4 bottom-4 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg shadow-primary/30 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
                →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
