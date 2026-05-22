import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError, type Artist } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Plus, Users, AlertTriangle } from "lucide-react";

const URL = "https://catalogusmusicus.mediarosenqvist.com/artists";

export const Route = createFileRoute("/artists")({
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
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["artists"], queryFn: api.listArtists, retry: false });
  const [form, setForm] = useState({ name: "", country: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => api.createArtist({ name: form.name, country: form.country || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artists"] });
      setForm({ name: "", country: "" });
      setMsg("Artist created.");
      setTimeout(() => setMsg(null), 2500);
    },
    onError: (e: unknown) => setMsg(e instanceof Error ? e.message : "Failed to create"),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Artists" description="Registered artists in the catalog." />

      <form
        onSubmit={(e) => { e.preventDefault(); if (form.name) create.mutate(); }}
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
        <Btn type="submit" disabled={create.isPending || !form.name}>
          <Plus className="h-4 w-4" /> {create.isPending ? "Creating…" : "Create artist"}
        </Btn>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </form>

      {q.isLoading && <div className="text-sm text-muted-foreground">Loading artists…</div>}

      {q.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>
            <div className="font-medium">Failed to load artists</div>
            <div className="text-xs">
              {q.error instanceof ApiError ? `${q.error.status} — ${q.error.message}` : (q.error as Error).message}
            </div>
          </div>
        </div>
      )}

      {!q.isLoading && !q.error && (q.data?.length ?? 0) === 0 && (
        <EmptyState />
      )}

      {!q.isLoading && (q.data?.length ?? 0) > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data!.map((a) => (
            <Link key={a.id} to="/artists/$id" params={{ id: a.id }}
              className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{name(a)}</div>
                  <div className="text-xs text-muted-foreground">{a.country ?? "—"}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <Users className="mx-auto h-8 w-8 text-muted-foreground" />
      <div className="mt-3 text-sm font-medium">No artists yet</div>
      <div className="text-xs text-muted-foreground">Create the first one using the form above.</div>
    </div>
  );
}
