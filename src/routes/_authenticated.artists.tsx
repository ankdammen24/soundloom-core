import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError, type Artist } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Artwork } from "@/components/media/Artwork";
import { CardGridSkeleton } from "@/components/Skeleton";
import { useOptimisticListAdd } from "@/hooks/useOptimisticList";
import { Plus, Users, AlertTriangle } from "lucide-react";

const URL = "https://catalogusmusicus.mediarosenqvist.com/artists";

export const Route = createFileRoute("/_authenticated/artists")({
  head: () => ({
    meta: [
      { title: "Artists – Catalogus Musicus" },
      { name: "description", content: "Artists registered in the Catalogus Musicus music catalog — manage profiles, releases and metadata for Media Rosenqvist." },
      { property: "og:title", content: "Artists – Catalogus Musicus" },
      { property: "og:description", content: "Registered artists in the Media Rosenqvist music catalog." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ArtistsPage,
});

function name(a: Artist) {
  return a.displayName ?? a.display_name ?? a.name ?? "Untitled artist";
}

function ArtistsPage() {
  const q = useQuery({ queryKey: ["artists"], queryFn: api.listArtists, retry: false });
  const [form, setForm] = useState({ name: "", country: "" });
  const [search, setSearch] = useState("");

  const create = useOptimisticListAdd<typeof form, Artist>(
    ["artists"],
    (vars) => api.createArtist({ name: vars.name, country: vars.country || undefined }),
    (vars) => ({ id: `optimistic-${Date.now()}`, name: vars.name, country: vars.country || undefined }),
  );

  const filtered = (q.data ?? []).filter((a) => name(a).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Artists" description="Registered artists in the catalog." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.name) {
            create.mutate(form);
            setForm({ name: "", country: "" });
          }
        }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Artist name" required />
        </div>
        <div className="w-40">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
          <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="SE" />
        </div>
        <Btn type="submit" disabled={!form.name}>
          <Plus className="h-4 w-4" /> Create artist
        </Btn>
      </form>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search artists…"
          className="max-w-sm flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">{q.data ? `${filtered.length} of ${q.data.length}` : ""}</span>
      </div>

      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}</div>
        </div>
      )}

      {q.isLoading && <CardGridSkeleton count={6} />}

      {!q.isLoading && !q.error && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-sm font-medium">{search ? "No artists match" : "No artists yet"}</div>
        </div>
      )}

      {!q.isLoading && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const isOptimistic = a.id.startsWith("optimistic-");
            const inner = (
              <div className={"flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition " + (isOptimistic ? "opacity-60" : "hover:border-primary/40")}>
                <Artwork src={a.imageUrl ?? a.image_url} seed={a.id + name(a)} size="sm" alt={name(a)} />
                <div className="min-w-0">
                  <div className="truncate font-medium">{name(a)}</div>
                  <div className="text-xs text-muted-foreground">{a.country ?? "—"}</div>
                </div>
              </div>
            );
            return isOptimistic ? (
              <div key={a.id}>{inner}</div>
            ) : (
              <Link key={a.id} to="/artists/$id" params={{ id: a.id }} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
