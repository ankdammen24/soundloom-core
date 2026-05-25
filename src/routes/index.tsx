import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { callbackLanding, fetchUserRoles, landingForRoles } from "@/lib/auth/landing";
import { supabase } from "@/integrations/supabase/client";

const CANONICAL_URL = "https://catalogusmusicus.mediarosenqvist.com/";

const AUTH_SEARCH_KEYS = [
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "token_type",
  "type",
  "sb",
];

function hasCallbackTokens(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  return Boolean(params.get("access_token") && params.get("refresh_token"));
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "",
  }),
  beforeLoad: () => {
    // Signed-in users land on their own profile; the public home stays for visitors.
    // Skip the redirect when an auth callback hash is present so the home page
    // can finish exchanging the tokens before navigating.
    if (typeof window !== "undefined" && hasCallbackTokens()) return;
    const { status, user } = authStore.getState();
    if (status === "authenticated") {
      throw redirect({ to: landingForRoles(user?.roles) });
    }
  },
  head: () => ({
    meta: [
      { title: "Catalogus Musicus – Media Rosenqvist Music Catalog" },
      { name: "description", content: "Catalogus Musicus is the catalog and upload interface for Media Rosenqvist — manage artists, releases and tracks across Radio Core, Music Core and Radio Uppsala." },
      { property: "og:title", content: "Catalogus Musicus – Media Rosenqvist Music Catalog" },
      { property: "og:description", content: "Catalog and upload interface for Media Rosenqvist — artists, releases and tracks across radio and music services." },
      { property: "og:url", content: CANONICAL_URL },
    ],
    links: [{ rel: "canonical", href: CANONICAL_URL }],
  }),
  component: Home,
});

function useAuthCallbackOnRoot(): { processing: boolean; error: string | null } {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [processing, setProcessing] = useState<boolean>(() => hasCallbackTokens());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasCallbackTokens()) return;
    let cancelled = false;

    (async () => {
      try {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token") ?? "";
        const refresh_token = params.get("refresh_token") ?? "";

        // Strip token material from the URL immediately so it cannot leak via
        // referrer, history, or analytics.
        const cleanUrl = new URL(window.location.href);
        cleanUrl.hash = "";
        AUTH_SEARCH_KEYS.forEach((key) => cleanUrl.searchParams.delete(key));
        cleanUrl.searchParams.delete("next");
        window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}`);

        const { data, error: setErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (cancelled) return;
        if (setErr) throw setErr;

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userErr || !userData.user) throw userErr ?? new Error("Session error");

        const session = data.session ?? (await supabase.auth.getSession()).data.session;
        if (!session) throw new Error("Session error");
        const roles = await fetchUserRoles(session.user.id);
        if (cancelled) return;
        authStore.setFromSession(session, roles);

        const target = callbackLanding(next, roles);
        await navigate({ to: target });
      } catch (err) {
        if (!cancelled) {
          setError((err as Error)?.message ?? "Session error");
          setProcessing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, next]);

  return { processing, error };
}

function Home() {
  const callback = useAuthCallbackOnRoot();

  if (callback.processing) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Slutför inloggning…
        </div>
      </div>
    );
  }

  const shortcuts = [
    { to: "/discover", label: "Discover", desc: "Nya och utvalda spår" },
    { to: "/releases", label: "Releases", desc: "Senaste utgåvorna" },
    { to: "/artists", label: "Artists", desc: "Bläddra bland artister" },
    { to: "/tracks", label: "Tracks", desc: "Hela katalogen" },
  ];
  return (
    <div className="space-y-8">
      {callback.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Inloggningen kunde inte slutföras: {callback.error}
        </div>
      )}
      <section
        className="relative overflow-hidden rounded-2xl p-8 md:p-12"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Catalogus Musicus</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">God morgon 👋</h1>
          <p className="mt-3 text-base text-foreground/80">
            Frontend för Media Rosenqvists musikkatalog
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Snabbåtkomst</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group relative overflow-hidden rounded-xl bg-secondary p-5 transition-all hover:bg-accent hover:-translate-y-0.5"
            >
              <div className="text-base font-semibold">{s.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
              <div className="absolute right-4 bottom-4 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg shadow-primary/30 transition-all group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
                →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
