import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { supabaseConfigured, SUPABASE_URL } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";
import { supabaseConfigured as connectConfigured } from "@/lib/supabase";
import { Database, Cloud, ShieldCheck, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings – Music Catalog Core" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const integrations = [
    {
      icon: Database, title: "Supabase",
      desc: supabaseConfigured
        ? `Connected to ${SUPABASE_URL}. Run supabase-schema.sql in the SQL editor if you haven't.`
        : "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect your existing project.",
      status: supabaseConfigured ? "connected" : "not_configured",
    },
    {
      icon: Cloud, title: "Cloudflare R2",
      desc: "Object storage for masters, normalized files, previews and artwork. Wire via S3-compatible credentials.",
      status: "not_configured",
    },
    {
      icon: ShieldCheck, title: "Authentication",
      desc: connectConfigured
        ? `Media Rosenqvist Connect (OAuth2 + PKCE). Bearer token attached to ${API_BASE_URL || "the Catalogus Musicus API"}.`
        : "Set VITE_CONNECT_BASE_URL, VITE_CONNECT_CLIENT_ID and VITE_CONNECT_REDIRECT_URI to enable sign-in.",
      status: connectConfigured ? "connected" : "not_configured",
    },
  ] as const;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Integrations, services and environment configuration."
      />

      <section className="space-y-3">
        {integrations.map((i) => (
          <div key={i.title} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-accent-foreground">
              <i.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{i.title}</div>
              <p className="text-sm text-muted-foreground">{i.desc}</p>
            </div>
            <div className="flex items-center gap-3">
              {i.status === "connected" ? (
                <span className="inline-flex items-center gap-1 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Connected</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-warning-foreground"><AlertTriangle className="h-4 w-4" /> Not configured</span>
              )}
              <Btn variant="outline" size="sm"><KeyRound className="h-4 w-4" /> Configure</Btn>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Catalog API</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Other services (Radio Core, Music Core, Aggregator, Radio Uppsala) consume the catalog
          through a single read API. Endpoints will be exposed under <code className="font-mono">/api/public/catalog/*</code>.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li><code className="font-mono text-foreground">GET /api/public/catalog/tracks</code></li>
          <li><code className="font-mono text-foreground">GET /api/public/catalog/artists</code></li>
          <li><code className="font-mono text-foreground">GET /api/public/catalog/playlists?scope=radio_core</code></li>
        </ul>
      </section>
    </>
  );
}

function hasEnv(key: string) {
  return Boolean((import.meta.env as Record<string, string | undefined>)[key]);
}
