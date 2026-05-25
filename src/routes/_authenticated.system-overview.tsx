import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { authStore } from "@/lib/auth/store";

export const Route = createFileRoute("/_authenticated/system-overview")({
  beforeLoad: ({ location }) => {
    const { status, user } = authStore.getState();
    if (status === "authenticated" && !(user?.roles ?? []).includes("admin")) {
      throw redirect({ to: "/dashboard", search: { redirect: location.href } as never });
    }
  },
  head: () => ({ meta: [{ title: "System Overview – Music Catalog" }] }),
  component: SystemOverviewPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </section>
  );
}

function SystemOverviewPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="System Overview"
        description="Single-source reference for the Music Catalog platform."
      />

      <Section title="Database structure (public schema)">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <code>profiles</code> — user profile (display_name, avatar, email)
          </li>
          <li>
            <code>user_roles</code> — role assignments (admin, editor, artist, viewer)
          </li>
          <li>
            <code>artists</code> — artist registry (name, slug, bio, image)
          </li>
          <li>
            <code>releases</code> — singles, EPs, albums (type, release_date, upc, artwork)
          </li>
          <li>
            <code>tracks</code> — individual tracks (isrc, duration, genre, audio file ref)
          </li>
          <li>
            <code>uploads</code> — upload submissions with status flow
          </li>
          <li>
            <code>audio_files</code> — binary metadata (path, duration, LUFS, peak — stub)
          </li>
          <li>
            <code>processing_jobs</code> — async job queue (queued → running → success/failed)
          </li>
          <li>
            <code>review_items</code> — editor review decisions (approve/reject)
          </li>
          <li>
            <code>api_keys</code> — hashed API keys for the public catalog API
          </li>
          <li>
            <code>audit_logs</code> — entity changes audit trail
          </li>
        </ul>
      </Section>

      <Section title="Upload flow">
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            User (artist/editor/admin) submits track metadata + file on <code>/uploads</code>
          </li>
          <li>
            Client inserts <code>uploads</code> row (status = <code>uploaded</code>)
          </li>
          <li>
            Client uploads binary to <code>audio-uploads</code> storage bucket at{" "}
            <code>{`{user_id}/{upload_id}/{filename}`}</code>
          </li>
          <li>
            Server creates <code>audio_files</code> + queues <code>processing_jobs</code> (Phase 2)
          </li>
          <li>
            Editor reviews via <code>/review</code> and decides approve/reject (Phase 2)
          </li>
        </ol>
      </Section>

      <Section title="Review flow (Phase 2)">
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Editor opens <code>/review</code> and selects an upload
          </li>
          <li>Reviews waveform, metadata and validation results</li>
          <li>Decides approve (→ tracks/releases created) or reject (with reason)</li>
          <li>
            Action recorded in <code>audit_logs</code>
          </li>
        </ol>
      </Section>

      <Section title="API flow (Phase 3)">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Public endpoints under <code>/api/public/catalog/*</code>
          </li>
          <li>
            API key passed via <code>Authorization: Bearer mc_…</code>
          </li>
          <li>
            Key hash matched against <code>api_keys.key_hash</code>
          </li>
          <li>Read-only access to approved tracks, releases, artists</li>
        </ul>
      </Section>

      <Section title="Environment variables">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> — browser
          </li>
          <li>
            <code>SUPABASE_URL</code>, <code>SUPABASE_PUBLISHABLE_KEY</code>,{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> — server
          </li>
          <li>
            <code>LOVABLE_API_KEY</code> — AI gateway (reserved)
          </li>
          <li>
            <code>R2_*</code> — legacy R2 credentials (reserved, not used in Phase 1)
          </li>
        </ul>
      </Section>

      <Section title="Next technical steps">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Phase 2:</strong> Server-side processing job creation, editor review UI with
            approve/reject, audit logging
          </li>
          <li>
            <strong>Phase 3:</strong> Public catalog REST API + API key management UI
          </li>
          <li>
            <strong>Phase 4:</strong> Real audio analysis (LUFS / true peak) — client-side via
            ffmpeg.wasm or server worker
          </li>
          <li>
            <strong>Phase 5:</strong> Multi-tenant organizations
          </li>
        </ul>
      </Section>
    </div>
  );
}
