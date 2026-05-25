import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "",
  }),
  component: AuthCallbackPage,
});

async function fetchRolesFor(userId: string): Promise<string[]> {
  try {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return (data ?? []).map((r) => r.role as string);
  } catch {
    return [];
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const { t } = useTranslation("auth");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveTarget(userId: string) {
      if (next) return next;
      const roles = await fetchRolesFor(userId);
      return roles.includes("admin") ? "/dashboard" : "/";
    }

    async function waitForSession() {
      const { data, error: getErr } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        const target = await resolveTarget(data.session.user.id);
        if (!cancelled) navigate({ to: target, replace: true });
        return;
      }
      if (getErr) {
        setError(getErr.message);
        return;
      }
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session) {
          sub.subscription.unsubscribe();
          void resolveTarget(session.user.id).then((target) => {
            if (!cancelled) navigate({ to: target, replace: true });
          });
        }
      });
      setTimeout(() => {
        if (cancelled) return;
        sub.subscription.unsubscribe();
        setError(t("callback.timeout"));
      }, 8000);
    }

    void waitForSession();
    return () => { cancelled = true; };
  }, [navigate, next, t]);

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
            <Button onClick={() => navigate({ to: "/sign-in" })}>{t("callback.backToSignIn")}</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>{t("callback.toHome")}</Button>
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
