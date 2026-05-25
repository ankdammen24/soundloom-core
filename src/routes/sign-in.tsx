import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Music2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/useAuth";
import { landingForRoles, safeInternalTarget } from "@/lib/auth/landing";
import { supabaseConfigured } from "@/lib/supabase";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "",
  }),
  component: SignInPage,
});

type Mode = "sign-in" | "sign-up";

function SignInPage() {
  return <AuthForm initialMode="sign-in" />;
}

export function AuthForm({ initialMode = "sign-in" }: { initialMode?: Mode }) {
  const { t } = useTranslation("auth");
  const { isAuthenticated, user, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, signInWithMicrosoft } = useAuth();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState<"google" | "apple" | "microsoft" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);


  if (isAuthenticated) {
    const safe = safeInternalTarget(search.redirect) || landingForRoles(user?.roles);
    return <Navigate to={safe} />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy("email");
    try {
      if (mode === "sign-in") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName || undefined);
        setInfo(t("signUp.created"));
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? "";
      if (/invalid login credentials/i.test(msg)) {
        setError(t("errors.invalidCredentials"));
      } else if (/user already registered/i.test(msg)) {
        setError(t("errors.userExists"));
      } else if (/email/i.test(msg) && /confirm/i.test(msg)) {
        setError(t("errors.confirmEmail"));
      } else {
        setError(msg || t("errors.googleFailed"));
      }
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle() {
    setError(null);
    setInfo(null);
    setBusy("google");
    try {
      await signInWithGoogle(search.redirect);
    } catch (err) {
      setError((err as Error)?.message ?? t("errors.googleFailed"));
      setBusy(null);
    }
  }

  async function onApple() {
    setError(null);
    setInfo(null);
    setBusy("apple");
    try {
      await signInWithApple(search.redirect);
    } catch (err) {
      setError((err as Error)?.message ?? t("errors.appleFailed"));
      setBusy(null);
    }
  }

  async function onMicrosoft() {
    setError(null);
    setInfo(null);
    setBusy("microsoft");
    try {
      await signInWithMicrosoft(search.redirect);
    } catch (err) {
      setError((err as Error)?.message ?? t("errors.microsoftFailed"));
      setBusy(null);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight">
        {mode === "sign-in" ? t("signIn.title") : t("signUp.title")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "sign-in" ? t("signIn.subtitle") : t("signUp.subtitle")}
      </p>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={() => void onGoogle()}
          disabled={busy !== null || !supabaseConfigured}
          className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleLogo />}
          {t("signIn.continueWithGoogle")}
        </button>
        <button
          type="button"
          onClick={() => void onMicrosoft()}
          disabled={busy !== null || !supabaseConfigured}
          className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          {busy === "microsoft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicrosoftLogo />}
          {t("signIn.continueWithMicrosoft")}
        </button>
        <button
          type="button"
          onClick={() => void onApple()}
          disabled={busy !== null || !supabaseConfigured}
          className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-border bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
        >
          {busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleLogo />}
          {t("signIn.continueWithApple")}
        </button>
      </div>


      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        {t("signIn.or")}
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "sign-up" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="name">
              {t("signUp.displayName")}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
            {t("signIn.email")}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
            {t("signIn.password")}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>

        <button
          type="submit"
          disabled={busy !== null || !supabaseConfigured}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "sign-in" ? t("signIn.submit") : t("signUp.submit")}
        </button>
      </form>

      <p className="mt-4 text-xs text-muted-foreground">
        {mode === "sign-in" ? (
          <>
            {t("signIn.noAccount")}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode("sign-up");
                setError(null);
                setInfo(null);
              }}
            >
              {t("signIn.createAccount")}
            </button>
          </>
        ) : (
          <>
            {t("signUp.haveAccount")}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode("sign-in");
                setError(null);
                setInfo(null);
              }}
            >
              {t("signUp.signInInstead")}
            </button>
          </>
        )}
      </p>

      {!supabaseConfigured && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {t("errors.backendNotConfigured")}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {info && (
        <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {info}
        </p>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        {t("signIn.footer")}
      </p>
    </AuthShell>
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

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.04c-.03-2.86 2.34-4.23 2.45-4.3-1.34-1.96-3.42-2.23-4.16-2.26-1.77-.18-3.46 1.04-4.36 1.04-.91 0-2.3-1.02-3.78-.99-1.94.03-3.74 1.13-4.74 2.87-2.02 3.5-.52 8.69 1.45 11.54.96 1.39 2.11 2.95 3.6 2.9 1.45-.06 1.99-.94 3.73-.94 1.74 0 2.23.94 3.76.91 1.55-.03 2.54-1.42 3.49-2.81 1.1-1.61 1.56-3.18 1.58-3.26-.04-.02-3.03-1.16-3.06-4.6zM14.32 3.69c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.54.77-3.37 1.74-.74.85-1.39 2.23-1.22 3.54 1.28.1 2.6-.65 3.4-1.62z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("auth");
  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher variant="compact" />
      </div>
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-background/20 backdrop-blur">
            <Music2 className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">{t("shell.brand")}</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
            Music catalog · distribution
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">
            {t("shell.tagline")}
          </h2>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
            {t("shell.manageCopy")}
          </p>
        </div>
        <div className="text-xs text-primary-foreground/60">© {t("shell.brand")}</div>
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-background/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
      </aside>
      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
