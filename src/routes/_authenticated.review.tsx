import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ClipboardCheck } from "lucide-react";
import { authStore } from "@/lib/auth/store";

export const Route = createFileRoute("/_authenticated/review")({
  beforeLoad: ({ location }) => {
    const { status, user } = authStore.getState();
    if (
      status === "authenticated" &&
      !(user?.roles ?? []).some((r) => ["admin", "editor"].includes(r))
    ) {
      throw redirect({ to: "/dashboard", search: { redirect: location.href } as never });
    }
  },
  head: () => ({ meta: [{ title: "Review – Music Catalog" }] }),
  component: ReviewPage,
});

type ReviewItem = {
  id: string;
  upload_id: string;
  decision: string | null;
  reason: string | null;
  decided_at: string | null;
  created_at: string;
};

function ReviewPage() {
  const items = useQuery({
    queryKey: ["review_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ReviewItem[];
    },
  });

  const pending = (items.data ?? []).filter((i) => !i.decision);
  const decided = (items.data ?? []).filter((i) => i.decision);

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Approve or reject uploaded audio. The full review UI ships in Phase 2."
      />

      <div className="rounded-lg border border-dashed border-border bg-card/50 p-5 mb-6 text-sm text-muted-foreground">
        <ClipboardCheck className="inline h-4 w-4 mr-2" />
        This is a read-only placeholder. Phase 2 adds inline playback, waveform inspection,
        approve/reject actions, and audit logging.
      </div>

      <section className="grid gap-3 sm:grid-cols-2 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Pending</div>
          <div className="mt-2 text-2xl font-semibold">{pending.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase text-muted-foreground">Decided</div>
          <div className="mt-2 text-2xl font-semibold">{decided.length}</div>
        </div>
      </section>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Upload</th>
              <th className="px-4 py-3 text-left font-medium">Decision</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.isLoading && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!items.isLoading && (items.data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  No review items yet.
                </td>
              </tr>
            )}
            {(items.data ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{r.upload_id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  {r.decision ?? <span className="text-muted-foreground">pending</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.reason ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
