import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { processingJobs, tracks } from "@/lib/mock-data";
import { Activity, RotateCw } from "lucide-react";
import { Btn } from "@/components/Btn";

export const Route = createFileRoute("/processing")({
  head: () => ({ meta: [{ title: "Processing status – Music Catalog Core" }] }),
  component: ProcessingPage,
});

function ProcessingPage() {
  const groups = {
    running: processingJobs.filter((j) => j.status === "running"),
    queued: processingJobs.filter((j) => j.status === "queued"),
    success: processingJobs.filter((j) => j.status === "success"),
    failed: processingJobs.filter((j) => j.status === "failed"),
  };

  return (
    <>
      <PageHeader
        title="Processing status"
        description="Normalize, preview, transcode, fingerprint and distribute jobs."
        actions={<Btn variant="outline"><RotateCw className="h-4 w-4" /> Refresh</Btn>}
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["running", "queued", "success", "failed"] as const).map((k) => (
          <div key={k} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
              <span>{k}</span><Activity className="h-3.5 w-3.5" />
            </div>
            <div className="mt-2 text-2xl font-semibold">{groups[k].length}</div>
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Job</th>
              <th className="px-4 py-3 text-left font-medium">Track</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Message</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processingJobs.map((j) => {
              const t = tracks.find((x) => x.id === j.track_id);
              return (
                <tr key={j.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 capitalize">{j.job_type}</td>
                  <td className="px-4 py-3">{t?.title ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{j.message}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(j.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{j.completed_at ? new Date(j.completed_at).toLocaleString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
