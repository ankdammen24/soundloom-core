import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { authStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";

const CALLBACK_TIMEOUT_MS = 10000;

function internalTarget(target: string): string {
  if (!target) return "";
  if (!target.startsWith("/") || target.startsWith("//")) return "";
  // Only allow simple internal paths.
  return target;
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "",
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { next } = Route.useSearch();
  const { t } = useTranslation("auth");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function landTarget(): string {
      return internalTarget(next) || "/profile";
    }

    function hardRedirect(to: string) {
      if (typeof window === "undefined") return;
      window.location.replace(to);
    }

    function parseHash(): { access_token: string; refresh_token: string } | null {
      if (typeof window === "undefined") return null;
      const raw = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      if (!raw) return null;
      const params = new URLSearchParams(raw);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (!access_token || !refresh_token) return null;
      return { access_token, refresh_token };
    }

    async function run() {
      try {
        // 1) If we already have a session, just go.
        const existing = await supabase.auth.getSession();
        if (cancelled) return;
        if (existing.data.session) {
          authStore.setFromSession(existing.data.session, []);
          hardRedirect(landTarget());
          return;
        }

        // 2) Try to consume tokens from the hash fragment.
        const tokens = parseHash();
        if (tokens) {
          // Strip the hash immediately so tokens don't linger in history.
          const cleanUrl = `${window.location.pathname}${window.location.search}`;
          window.history.replaceState({}, "", cleanUrl);

          const { data, error: setErr } = await supabase.auth.setSession(tokens);
          if (cancelled) return;
          if (setErr) {
            setError(setErr.message);
            return;
          }
          if (data.session) {
            authStore.setFromSession(data.session, []);
            hardRedirect(landTarget());
            return;
          }
        }

        // 3) Last resort: wait briefly for an auth-state event (e.g. PKCE).
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
          if (cancelled) return;
          if (
            session &&
            (event === "SIGNED_IN" ||
              event === "INITIAL_SESSION" ||
              event === "TOKEN_REFRESHED")
          ) {
            sub.subscription.unsubscribe();
            authStore.setFromSession(session, []);
            hardRedirect(landTarget());
          }
        });

        const timeout = setTimeout(() => {
          if (cancelled) return;
          sub.subscription.unsubscribe();
          setError(t("callback.timeout"));
        }, CALLBACK_TIMEOUT_MS);

        return () => {
          clearTimeout(timeout);
          sub.subscription.unsubscribe();
        };
      } catch (err) {
        if (!cancelled) setError((err as Error)?.message ?? "Session error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [next, t]);

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">{t("callback.failed")}</h1>
          <p className="text-sm text-muted-foreground break-words">{error}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => window.location.replace("/sign-in")}>
              {t("callback.backToSignIn")}
            </Button>
            <Button variant="outline" onClick={() => window.location.replace("/")}>
              {t("callback.toHome")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("callback.finishing")}
      </div>
    </div>
  );
}
