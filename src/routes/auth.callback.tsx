import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { authStore } from "@/lib/auth/store";
import { callbackLanding, fetchUserRoles } from "@/lib/auth/landing";
import { Button } from "@/components/ui/button";

const CALLBACK_TIMEOUT_MS = 10000;
const AUTH_SEARCH_KEYS = [
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "token_type",
  "type",
  "sb",
];

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), CALLBACK_TIMEOUT_MS);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        window.clearTimeout(timer);
        reject(reason);
      },
    );
  });
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

    function hardRedirect(to: string) {
      if (typeof window === "undefined") return;
      window.location.replace(to);
    }

    function parseTokens(): { access_token: string; refresh_token: string } | null {
      if (typeof window === "undefined") return null;
      const raw = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const params = new URLSearchParams(raw || window.location.search.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (!access_token || !refresh_token) return null;
      return { access_token, refresh_token };
    }

    function cleanUrl() {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.hash = "";
      AUTH_SEARCH_KEYS.forEach((key) => url.searchParams.delete(key));
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }

    async function run() {
      try {
        // Always consume fresh callback tokens before trusting any old cached session.
        const tokens = parseTokens();
        if (tokens) {
          cleanUrl();

          const { data, error: setErr } = await withTimeout(
            supabase.auth.setSession(tokens),
            t("callback.timeout"),
          );
          if (cancelled) return;
          if (setErr) throw setErr;

          const { data: userData, error: userErr } = await withTimeout(
            supabase.auth.getUser(),
            t("callback.timeout"),
          );
          if (cancelled) return;
          if (userErr || !userData.user) throw userErr ?? new Error(t("callback.timeout"));

          const session = data.session ?? (await supabase.auth.getSession()).data.session;
          if (!session) throw new Error(t("callback.timeout"));

          const roles = await withTimeout(fetchUserRoles(session.user.id), t("callback.timeout"));
          if (cancelled) return;
          authStore.setFromSession(session, roles);
          hardRedirect(callbackLanding(next, roles));
          return;
        }

        const { data: userData, error: userErr } = await withTimeout(
          supabase.auth.getUser(),
          t("callback.timeout"),
        );
        if (cancelled) return;
        if (userErr || !userData.user) throw userErr ?? new Error(t("callback.timeout"));

        const existing = await supabase.auth.getSession();
        if (cancelled) return;
        if (!existing.data.session) throw new Error(t("callback.timeout"));

        const roles = await withTimeout(fetchUserRoles(existing.data.session.user.id), t("callback.timeout"));
        if (cancelled) return;
        authStore.setFromSession(existing.data.session, roles);
        hardRedirect(callbackLanding(next, roles));
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
