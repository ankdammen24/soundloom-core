import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Send, Music2, Upload, ClipboardCheck, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – Music Catalog" }] }),
  component: DashboardPage,
});

async function fetchStats() {
  const tables = ["artists", "releases", "tracks", "uploads", "processing_jobs", "review_items"] as const;
  const results = await Promise.all(
    tables.map((t) =>
      supabase.from(t).select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
    ),
  );
  const [artists, releases, tracks, uploads, jobs, reviews] = results;
  return { artists, releases, tracks, uploads, jobs, reviews };
}

async function fetchRecentReleases() {
  const { data } = await supabase
    .from("releases")
    .select("id, title, type, release_date")
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

function DashboardPage() {
  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });
  const recent = useQuery({ queryKey: ["dashboard-recent"], queryFn: fetchRecentReleases });

  const cards = [
    { label: "Artists", value: stats.data?.artists, icon: Users, to: "/artists" },
    { label: "Releases", value: stats.data?.releases, icon: Send, to: "/releases" },
    { label: "Tracks", value: stats.data?.tracks, icon: Music2, to: "/tracks" },
    { label: "Uploads", value: stats.data?.uploads, icon: Upload, to: "/uploads" },
    { label: "Processing", value: stats.data?.jobs, icon: Cpu, to: "/processing" },
    { label: "Review queue", value: stats.data?.reviews, icon: ClipboardCheck, to: "/review" },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Media Rosenqvist — music catalog overview." />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-xl bg-card border border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
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

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Recent releases</h2>
            <p className="text-sm text-muted-foreground">Latest entries in the catalog</p>
          </div>
          <Link to="/releases" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        {recent.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : (recent.data ?? []).length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Send className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No releases yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(recent.data ?? []).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-card border border-border/60 p-3">
                <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 text-primary">
                  <Music2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{r.title}</div>
                  <div className="truncate text-xs text-muted-foreground capitalize">{r.type ?? "—"} · {r.release_date ?? "no date"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
