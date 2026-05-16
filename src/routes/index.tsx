import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  artists, albums, tracks, releases, playlists, processingJobs, findArtist,
} from "@/lib/mock-data";
import {
  Users, Disc3, Music2, Send, ListMusic, Activity, ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard – Music Catalog Core" }] }),
  component: Dashboard,
});

function Dashboard() {
  const stats = [
    { label: "Artists", value: artists.length, icon: Users, to: "/artists" },
    { label: "Albums", value: albums.length, icon: Disc3, to: "/albums" },
    { label: "Tracks", value: tracks.length, icon: Music2, to: "/tracks" },
    { label: "Releases", value: releases.length, icon: Send, to: "/releases" },
    { label: "Playlists", value: playlists.length, icon: ListMusic, to: "/playlists" },
    { label: "Active jobs", value: processingJobs.filter((j) => j.status === "running" || j.status === "queued").length, icon: Activity, to: "/processing" },
  ] as const;

  const recent = [...tracks].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
  const attention = tracks.filter((t) => t.status === "needs_metadata" || t.status === "needs_rights_check" || t.rights_status === "incomplete").slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Central source of truth for Radio Core, Music Core, distribution and Radio Uppsala."
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-3 text-2xl font-semibold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent tracks</h2>
            <Link to="/tracks" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{findArtist(t.artist_id)?.display_name} · {t.genre}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.rights_status} />
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Needs attention</h2>
            <p className="text-xs text-muted-foreground">Metadata or rights gaps</p>
          </div>
          <ul className="divide-y divide-border">
            {attention.length === 0 && (
              <li className="px-5 py-6 text-sm text-muted-foreground">All clear 🎉</li>
            )}
            {attention.map((t) => (
              <li key={t.id} className="px-5 py-3 text-sm">
                <div className="font-medium">{t.title}</div>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <StatusBadge status={t.rights_status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
