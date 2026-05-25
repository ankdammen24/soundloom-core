import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Music2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { msalConfigured } from "@/lib/auth/msal";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/dashboard",
  }),
  component: SignInPage,
});

function SignInPage() {
  const { isAuthenticated, loginRedirect } = useAuth();
  const search = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to={search.redirect} />;

  async function onSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await loginRedirect(search.redirect);
    } catch (err) {
      setError((err as Error)?.message ?? "Sign in failed.");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your Catalogus Musicus workspace with your Microsoft account.
      </p>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onSignIn}
          disabled={submitting || !msalConfigured}
          className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicrosoftLogo />}
          Sign in with Microsoft
        </button>
        {!msalConfigured && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Entra is not configured. Set VITE_ENTRA_CLIENT_ID, VITE_ENTRA_AUTHORITY and VITE_ENTRA_AUDIENCE.
          </p>
        )}
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        By signing in you agree to your organization's Entra ID terms. New accounts are provisioned by an
        administrator.
      </p>
    </AuthShell>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="6.5" height="6.5" fill="#F25022" />
      <rect x="8.5" y="1" width="6.5" height="6.5" fill="#7FBA00" />
      <rect x="1" y="8.5" width="6.5" height="6.5" fill="#00A4EF" />
      <rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#FFB900" />
    </svg>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/20 backdrop-blur">
            <Music2 className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">Catalogus Musicus</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
            Music catalog · distribution
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">
            The modern music catalog and distribution platform.
          </h2>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
            Manage artists, releases, tracks and assets — and push them out to the world.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/60">© Catalogus Musicus</div>
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-background/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
      </aside>
      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
