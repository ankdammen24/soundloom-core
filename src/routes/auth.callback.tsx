import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuthState } from "@/lib/auth/store";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    state: typeof search.state === "string" ? search.state : undefined,
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { status } = useAuthState();
  const { state } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "loading") return;
    let dest = "/dashboard";
    if (state) {
      try {
        dest = decodeURIComponent(state);
      } catch {
        /* ignore */
      }
    }
    if (status === "authenticated") {
      navigate({ to: dest });
    } else {
      navigate({ to: "/sign-in" });
    }
  }, [status, state, navigate]);

  return (
    <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Completing sign in…
      </div>
    </div>
  );
}
