import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { KeyRound } from "lucide-react";
import { authStore } from "@/lib/auth/store";

export const Route = createFileRoute("/_authenticated/api-keys")({
  beforeLoad: ({ location }) => {
    const { status, user } = authStore.getState();
    if (status === "authenticated" && !(user?.roles ?? []).includes("admin")) {
      throw redirect({ to: "/dashboard", search: { redirect: location.href } as never });
    }
  },
  head: () => ({ meta: [{ title: "API keys – Music Catalog" }] }),
  component: ApiKeysPage,
});

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

function ApiKeysPage() {
  const keys = useQuery({
    queryKey: ["api_keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, prefix, created_at, last_used_at, revoked_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiKey[];
    },
  });

  return (
    <>
      <PageHeader
        title="API keys"
        description="Manage keys for the public catalog API (Phase 3)."
      />

      <div className="rounded-lg border border-dashed border-border bg-card/50 p-5 mb-6 text-sm text-muted-foreground">
        <KeyRound className="inline h-4 w-4 mr-2" />
        Key generation, scoping, and the public catalog API ship in Phase 3. The table below shows
        the underlying schema is live.
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Prefix</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Last used</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {keys.isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!keys.isLoading && (keys.data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No API keys yet.
                </td>
              </tr>
            )}
            {(keys.data ?? []).map((k) => (
              <tr key={k.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{k.prefix}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(k.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  {k.revoked_at ? (
                    <span className="text-destructive">revoked</span>
                  ) : (
                    <span className="text-success">active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
