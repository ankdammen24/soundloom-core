import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { authStore } from "@/lib/auth/store";

const URL = "https://catalogusmusicus.mediarosenqvist.com/";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Signed-in users land on their own profile; the public home stays for visitors.
    const { status } = authStore.getState();
    if (status === "authenticated") {
      throw redirect({ to: "/profile" });
    }
  },
  head: () => ({
    meta: [
      { title: "Catalogus Musicus – Media Rosenqvist Music Catalog" },
      { name: "description", content: "Catalogus Musicus is the catalog and upload interface for Media Rosenqvist — manage artists, releases and tracks across Radio Core, Music Core and Radio Uppsala." },
      { property: "og:title", content: "Catalogus Musicus – Media Rosenqvist Music Catalog" },
      { property: "og:description", content: "Catalog and upload interface for Media Rosenqvist — artists, releases and tracks across radio and music services." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Home,
});

function Home() {
  const shortcuts = [
    { to: "/discover", label: "Discover", desc: "Nya och utvalda spår" },
    { to: "/releases", label: "Releases", desc: "Senaste utgåvorna" },
    { to: "/artists", label: "Artists", desc: "Bläddra bland artister" },
    { to: "/tracks", label: "Tracks", desc: "Hela katalogen" },
  ];
  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-2xl p-8 md:p-12"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Catalogus Musicus</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">God morgon 👋</h1>
          <p className="mt-3 text-base text-foreground/80">
            Frontend för Media Rosenqvists musikkatalog
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Snabbåtkomst</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
