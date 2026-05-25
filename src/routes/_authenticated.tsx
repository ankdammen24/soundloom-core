import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuthState } from "@/lib/auth/store";
import { requireAuth } from "@/lib/auth/guards";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => {
    requireAuth({ href: location.href });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { status } = useAuthState();

  if (status === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading session…
        </div>
      </div>
    );
  }
  return <Outlet />;
}
