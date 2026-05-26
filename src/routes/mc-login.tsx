import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useMcAuth } from "@/lib/mc-auth/useMcAuth";
import { mcAuthStore } from "@/lib/mc-auth/store";

type Search = { redirect?: string };

export const Route = createFileRoute("/mc-login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (mcAuthStore.getState().status === "authenticated") {
      throw redirect({ to: search.redirect ?? "/admin/mc" });
    }
  },
  component: McLoginPage,
});

function McLoginPage() {
  const { login } = useMcAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const target = search.redirect ?? "/admin/mc";
      navigate({ to: target });
    } catch (err) {
      setError((err as Error).message || "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Soundloom · Media Catalog
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your media-catalog backend account to access admin tools.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
          <div className="space-y-1.5">
            <label htmlFor="mc-email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="mc-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="mc-password" className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="mc-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            Connects to api.mediarosenqvist.com
          </p>
        </form>
      </div>
    </div>
  );
}
