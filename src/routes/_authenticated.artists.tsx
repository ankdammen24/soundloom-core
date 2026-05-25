import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { Plus, Users, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";

export const Route = createFileRoute("/_authenticated/artists")({
  head: () => ({ meta: [{ title: "Artists – Music Catalog" }] }),
  component: ArtistsPage,
});

type Artist = { id: string; name: string; slug: string; bio: string | null; image_url: string | null; created_at: string };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `artist-${Date.now()}`;
}

function ArtistsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", bio: "" });

  const list = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Artist[];
    },
  });

  const create = useMutation({
    mutationFn: async (v: { name: string; bio: string }) => {
      const { error } = await supabase.from("artists").insert({
        name: v.name,
        slug: slugify(v.name),
        bio: v.bio || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", bio: "" });
      qc.invalidateQueries({ queryKey: ["artists"] });
    },
  });

  const canCreate = (user?.roles ?? []).some((r) => ["admin", "editor", "artist"].includes(r));

  return (
    <div className="space-y-6">
      <PageHeader title="Artists" description="Registered artists in the catalog." />

      {canCreate && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (form.name) create.mutate(form); }}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Artist name"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Short bio (optional)"
            />
          </div>
          <Btn type="submit" disabled={!form.name || create.isPending}>
            <Plus className="h-4 w-4" /> Create
          </Btn>
        </form>
      )}

      {create.error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{(create.error as Error).message}</div>
        </div>
      )}

      {list.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {list.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {(list.error as Error).message}
        </div>
      )}

      {!list.isLoading && (list.data ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-3 text-sm font-medium">No artists yet</div>
        </div>
      )}

      {(list.data ?? []).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(list.data ?? []).map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{a.name}</div>
                <div className="truncate text-xs text-muted-foreground">{a.bio ?? "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
