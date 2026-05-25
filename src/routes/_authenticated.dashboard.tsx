import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Send, Music2, Boxes, Upload, Radio, Plus, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { requireRole } from "@/lib/auth/guards";
import { RoleGuard } from "@/components/auth/RoleGuard";

const URL = "https://catalogusmusicus.mediarosenqvist.com/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard – Catalogus Musicus" },
      { name: "description", content: "Your catalog at a glance — artists, releases, tracks and recent activity in Catalogus Musicus." },
      { property: "og:title", content: "Dashboard – Catalogus Musicus" },
      { property: "og:description", content: "The modern music catalog and distribution platform." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const artists = useQuery({ queryKey: ["artists"], queryFn: api.listArtists });
  const releases = useQuery({ queryKey: ["releases"], queryFn: api.listReleases });
  const tracks = useQuery({ queryKey: ["tracks"], queryFn: api.listTracks });

  const stats = [
    { label: "Artists", value: artists.data?.length, icon: Users, to: "/artists" },
    { label: "Releases", value: releases.data?.length, icon: Send, to: "/releases" },
    { label: "Tracks", value: tracks.data?.length, icon: Music2, to: "/tracks" },
    { label: "Assets", value: undefined, icon: Boxes, to: "/assets" },
  ] as const;

  const recentReleases = (releases.data ?? []).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl p-8 md:p-10 border border-border/40"
        style={{ background: "var(--gradient-hero, linear-gradient(135deg, var(--primary), oklch(0.55 0.2 300)))" }}
      >
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
            Catalogus Musicus
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground">
            The modern music catalog<br className="hidden md:block" /> and distribution platform
          </h1>
          <p className="mt-3 text-sm md:text-base text-primary-foreground/85 max-w-lg">
            Manage artists, releases, tracks and assets — and push them out to the world.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/uploads"
              className="inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
            >
              <Upload className="h-4 w-4" /> Upload audio
            </Link>
            <Link
              to="/releases"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm font-medium text-primary-foreground ring-1 ring-inset ring-primary-foreground/30 hover:bg-background/20"
            >
              <Plus className="h-4 w-4" /> New release
            </Link>
            <Link
              to="/distribution"
              className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm font-medium text-primary-foreground ring-1 ring-inset ring-primary-foreground/30 hover:bg-background/20"
            >
              <Radio className="h-4 w-4" /> Distribution
            </Link>
          </div>
        </div>
        <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
      </section>

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-xl bg-card border border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">
              {s.value === undefined ? <span className="text-muted-foreground/40">—</span> : s.value}
            </div>
          </Link>
        ))}
      </section>

      {/* Recent releases */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Recently added</h2>
            <p className="text-sm text-muted-foreground">Latest releases in your catalog</p>
          </div>
          <Link to="/releases" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        {releases.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : recentReleases.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Send className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No releases yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentReleases.map((r: any) => (
              <Link
                key={r.id}
                to="/releases/$id"
                params={{ id: String(r.id) }}
                className="group flex items-center gap-3 rounded-xl bg-card border border-border/60 p-3 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 text-primary">
                  <Music2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{r.title ?? r.name ?? "Untitled"}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.artist?.name ?? r.artistName ?? "—"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer link to status */}
      <section className="rounded-xl border border-border/60 bg-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-success/15 text-success">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <div className="font-medium">Platform health</div>
            <div className="text-xs text-muted-foreground">Live status of the catalog backend</div>
          </div>
        </div>
        <Link to="/status" className="text-sm font-medium text-primary hover:underline">
          Open status →
        </Link>
      </section>
    </div>
  );
}
