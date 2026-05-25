import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { handleCallback } from "@/lib/connectAuth";
import { authStore } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/useAuth";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginRedirect } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user, returnTo } = await handleCallback();
        if (cancelled) return;
        authStore.setFromUser(user);
        // Strip the OAuth params from the URL before navigating.
        window.history.replaceState({}, "", returnTo);
        navigate({ to: returnTo, replace: true });
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("[auth] callback failed", e);
        setError((e as Error)?.message ?? "Login failed.");
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Inloggning misslyckades</h1>
          <p className="text-sm text-muted-foreground break-words">{error}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => void loginRedirect("/dashboard")}>Försök igen</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>Till startsidan</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Slutför inloggning…
      </div>
    </div>
  );
}
