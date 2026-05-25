import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Activity } from "lucide-react";
import { authStore } from "@/lib/auth/store";

export const Route = createFileRoute("/_authenticated/processing")({
  beforeLoad: ({ location }) => {
    const { status, user } = authStore.getState();
    if (
      status === "authenticated" &&
      !(user?.roles ?? []).some((r) => ["admin", "editor"].includes(r))
    ) {
      throw redirect({ to: "/dashboard", search: { redirect: location.href } as never });
    }
  },
  head: () => ({ meta: [{ title: "Processing – Music Catalog" }] }),
  component: ProcessingPage,
});

type Job = {
  id: string;
  upload_id: string;
  status: string;
  attempts: number;
  last_error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

function ProcessingPage() {
  const jobs = useQuery({
    queryKey: ["processing_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processing_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Job[];
    },
  });

  const data = jobs.data ?? [];
  const groups = {
    queued: data.filter((j) => j.status === "queued").length,
    running: data.filter((j) => j.status === "running").length,
    success: data.filter((j) => j.status === "success").length,
    failed: data.filter((j) => j.status === "failed").length,
  };

  return (
    <>
      <PageHeader
        title="Processing"
        description="Audio processing job queue (stub — real analysis comes in Phase 4)."
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["queued", "running", "success", "failed"] as const).map((k) => (
          <div key={k} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
              <span>{k}</span>
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{groups[k]}</div>
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Job</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Attempts</th>
              <th className="px-4 py-3 text-left font-medium">Error</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!jobs.isLoading && data.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No jobs yet.
                </td>
              </tr>
            )}
            {data.map((j) => (
              <tr key={j.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{j.id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs">{j.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{j.attempts}</td>
                <td className="px-4 py-3 text-muted-foreground">{j.last_error ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(j.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
