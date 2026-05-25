import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Database, ShieldCheck, Cloud, CheckCircle2 } from "lucide-react";
import { authStore } from "@/lib/auth/store";

export const Route = createFileRoute("/_authenticated/settings")({
  beforeLoad: ({ location }) => {
    const { status, user } = authStore.getState();
    if (status === "authenticated" && !(user?.roles ?? []).includes("admin")) {
      throw redirect({ to: "/dashboard", search: { redirect: location.href } as never });
    }
  },
  head: () => ({ meta: [{ title: "Settings – Music Catalog" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const items = [
    { icon: Database, title: "Database", desc: "Lovable Cloud (Postgres + Row Level Security)", connected: true },
    { icon: ShieldCheck, title: "Authentication", desc: "Email + Google via Lovable Cloud", connected: true },
    { icon: Cloud, title: "Storage", desc: "audio-uploads (private), audio-previews (public), artwork (public)", connected: true },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Backend services and configuration." />

      <section className="space-y-3">
        {items.map((i) => (
          <div key={i.title} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
              <i.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{i.title}</div>
              <p className="text-sm text-muted-foreground">{i.desc}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Connected
            </span>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Organization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Media Rosenqvist — single-tenant catalog. Multi-tenant org support is planned for a later phase.
        </p>
      </section>
    </>
  );
}
