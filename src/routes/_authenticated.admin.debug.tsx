import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthState } from "@/lib/auth/store";
import {
  callbackLanding,
  fetchUserRoles,
  landingForRoles,
  safeInternalTarget,
} from "@/lib/auth/landing";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/debug")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "",
  }),
  component: AdminDebugPage,
});

type Snapshot = {
  takenAt: string;
  storeStatus: string;
  storeRoles: string[];
  fetchedRoles: string[];
  userId: string | null;
  email: string | null;
  provider: string | null;
  hasSession: boolean;
  accessTokenPreview: string | null;
  expiresAt: string | null;
  appMetadata: unknown;
  userMetadata: unknown;
  error: string | null;
};

function shortToken(t?: string | null) {
  if (!t) return null;
  return `${t.slice(0, 10)}…${t.slice(-6)} (len ${t.length})`;
}

function AdminDebugPage() {
  const { next } = Route.useSearch();
  const auth = useAuthState();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [{ data: sessionData }, { data: userData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);
      const session = sessionData.session;
      const user = userData.user;
      const fetchedRoles = user ? await fetchUserRoles(user.id) : [];

      setSnap({
        takenAt: new Date().toISOString(),
        storeStatus: auth.status,
        storeRoles: auth.user?.roles ?? [],
        fetchedRoles,
        userId: user?.id ?? null,
        email: user?.email ?? null,
        provider: (user?.app_metadata?.provider as string | undefined) ?? null,
        hasSession: !!session,
        accessTokenPreview: shortToken(session?.access_token),
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        appMetadata: user?.app_metadata ?? null,
        userMetadata: user?.user_metadata ?? null,
        error: null,
      });
    } catch (err) {
      setSnap({
        takenAt: new Date().toISOString(),
        storeStatus: auth.status,
        storeRoles: auth.user?.roles ?? [],
        fetchedRoles: [],
        userId: null,
        email: null,
        provider: null,
        hasSession: false,
        accessTokenPreview: null,
        expiresAt: null,
        appMetadata: null,
        userMetadata: null,
        error: (err as Error)?.message ?? "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gate to admins only (defensive; nav link is also gated).
  if (auth.status === "authenticated" && !auth.user?.roles.includes("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  const rolesForCalc = snap?.fetchedRoles ?? auth.user?.roles ?? [];
  const safeNext = safeInternalTarget(next);
  const target = callbackLanding(next, rolesForCalc);
  const defaultLanding = landingForRoles(rolesForCalc);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Auth debug</h1>
          <p className="text-sm text-muted-foreground">
            Snapshot of the current session, roles and the redirect target the auth callback would
            compute for a given <code>next</code>.
          </p>
        </div>
        <Button onClick={() => void load()} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </header>

      <Section title="Redirect calculation">
        <Row label="Input next (raw)" value={next || "(empty)"} />
        <Row label="Input next (sanitized)" value={safeNext || "(empty → uses role landing)"} />
        <Row label="Roles used" value={rolesForCalc.length ? rolesForCalc.join(", ") : "(none)"} />
        <Row label="Default role landing" value={defaultLanding} />
        <Row label="Computed redirect target" value={target} highlight />
        <div className="flex flex-wrap gap-2 pt-2">
          {["", "/profile", "/dashboard", "/admin/users", "/uploads", "//evil.com"].map((n) => (
            <Link
              key={n || "empty"}
              to="/admin/debug"
              search={{ next: n }}
              className="rounded border px-2 py-1 text-xs hover:bg-muted"
            >
              try next={n || "(empty)"}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Auth store (in-memory)">
        <Row label="status" value={auth.status} />
        <Row label="user.id" value={auth.user?.id ?? "—"} />
        <Row label="user.email" value={auth.user?.email ?? "—"} />
        <Row label="user.provider" value={auth.user?.provider ?? "—"} />
        <Row label="user.roles" value={auth.user?.roles.join(", ") || "(none)"} />
      </Section>

      <Section title="Supabase session (live fetch)">
        {snap?.error && <p className="text-sm text-destructive">Error: {snap.error}</p>}
        <Row label="taken at" value={snap?.takenAt ?? "—"} />
        <Row label="has session" value={String(snap?.hasSession ?? false)} />
        <Row label="user.id" value={snap?.userId ?? "—"} />
        <Row label="user.email" value={snap?.email ?? "—"} />
        <Row label="provider" value={snap?.provider ?? "—"} />
        <Row label="access_token" value={snap?.accessTokenPreview ?? "—"} />
        <Row label="expires_at" value={snap?.expiresAt ?? "—"} />
        <Row label="fetched roles (DB)" value={snap?.fetchedRoles.join(", ") || "(none)"} />
      </Section>

      <Section title="Raw metadata">
        <pre className="overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(
            { app_metadata: snap?.appMetadata, user_metadata: snap?.userMetadata },
            null,
            2,
          )}
        </pre>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-baseline gap-3 border-b border-border/40 py-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <code className={`text-sm break-all ${highlight ? "font-semibold text-primary" : ""}`}>
        {value}
      </code>
    </div>
  );
}
