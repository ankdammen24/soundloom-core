import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Music2, Loader2 } from "lucide-react";
import { useAuth, type SupportedProvider } from "@/lib/auth/useAuth";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/dashboard",
  }),
  component: SignInPage,
});

const PROVIDERS: Array<{ id: SupportedProvider; label: string; Logo: () => JSX.Element }> = [
  { id: "azure", label: "Fortsätt med Microsoft", Logo: MicrosoftLogo },
  { id: "google", label: "Fortsätt med Google", Logo: GoogleLogo },
  { id: "github", label: "Fortsätt med GitHub", Logo: GitHubLogo },
  { id: "apple", label: "Fortsätt med Apple", Logo: AppleLogo },
];

function SignInPage() {
  const { isAuthenticated, signInWith } = useAuth();
  const search = Route.useSearch();
  const [busy, setBusy] = useState<SupportedProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to={search.redirect} />;

  async function onProvider(id: SupportedProvider) {
    setError(null);
    setBusy(id);
    try {
      await signInWith(id, search.redirect);
      // signInWithOAuth redirects the browser; if we get here without redirect, surface it.
    } catch (err) {
      setError((err as Error)?.message ?? "Inloggningen misslyckades.");
      setBusy(null);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight">Logga in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Välj en inloggningsmetod för att komma åt Music Catalog.
      </p>

      <div className="mt-6 space-y-2">
        {PROVIDERS.map(({ id, label, Logo }) => (
          <button
            key={id}
            type="button"
            onClick={() => void onProvider(id)}
            disabled={busy !== null || !supabaseConfigured}
            className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
          >
            {busy === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Logo />}
            {label}
          </button>
        ))}
      </div>

      {!supabaseConfigured && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Supabase är inte konfigurerat. Sätt VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Inloggningen misslyckades. {error}
        </p>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Genom att fortsätta godkänner du villkoren för Music Catalog. Inloggningstjänsten hanteras säkert via Lovable Cloud (Supabase Auth).
      </p>
    </AuthShell>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect x="1" y="1" width="6.5" height="6.5" fill="#F25022" />
      <rect x="8.5" y="1" width="6.5" height="6.5" fill="#7FBA00" />
      <rect x="1" y="8.5" width="6.5" height="6.5" fill="#00A4EF" />
      <rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#FFB900" />
    </svg>
  );
}
function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.7 39.7 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.7 36.4 44 30.8 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
function GitHubLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.49-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82a7.65 7.65 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.182.008c.31 1.156-.155 2.31-.794 3.105-.66.812-1.736 1.429-2.776 1.396-.296-1.073.273-2.227.834-2.937.626-.804 1.752-1.43 2.736-1.564zM13.5 11.78c-.32.741-.475 1.073-.886 1.726-.572.911-1.38 2.046-2.38 2.054-.892.008-1.121-.581-2.331-.574-1.21.007-1.463.585-2.357.577-1-.008-1.766-1.033-2.338-1.944C1.61 10.998 1.443 7.755 2.71 6.03c.9-1.225 2.32-1.94 3.655-1.94 1.358 0 2.213.745 3.337.745 1.09 0 1.755-.746 3.325-.746 1.186 0 2.444.647 3.34 1.764-2.937 1.609-2.46 5.805-.867 6.927z" />
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
