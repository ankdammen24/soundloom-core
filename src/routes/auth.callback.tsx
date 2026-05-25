import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "/dashboard",
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Supabase's detectSessionInUrl handles ?code=... / #access_token= automatically.
    // We just wait for a session to appear (via getSession or onAuthStateChange).
    async function waitForSession() {
      const { data, error: getErr } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate({ to: next, replace: true });
        return;
      }
      if (getErr) {
        setError(getErr.message);
        return;
      }
      // Fallback: listen briefly for SIGNED_IN; timeout after 8s.
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session) {
          sub.subscription.unsubscribe();
          navigate({ to: next, replace: true });
        }
      });
      setTimeout(() => {
        if (cancelled) return;
        sub.subscription.unsubscribe();
        setError("Inloggningen misslyckades. Försök igen.");
      }, 8000);
    }

    void waitForSession();
    return () => { cancelled = true; };
  }, [navigate, next]);

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Inloggningen misslyckades</h1>
          <p className="text-sm text-muted-foreground break-words">{error}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate({ to: "/sign-in" })}>Tillbaka till inloggning</Button>
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
