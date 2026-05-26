import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { requireMcAuth } from "@/lib/mc-auth/guards";
import { useMcAuthState } from "@/lib/mc-auth/store";

export const Route = createFileRoute("/_mc-authenticated")({
  beforeLoad: ({ location }) => {
    requireMcAuth({ href: location.href });
  },
  component: McAuthenticatedLayout,
});

function McAuthenticatedLayout() {
  const { status } = useMcAuthState();
  if (status === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking session…
        </div>
      </div>
    );
  }
  return <Outlet />;
}
