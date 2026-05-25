import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuthState } from "@/lib/auth/store";
import { Loader2 } from "lucide-react";

type Props = {
  roles: string[];
  children: ReactNode;
  /** Where to redirect users that lack the required role. Defaults to "/". */
  fallback?: string;
};

/**
 * Render `children` only if the current user has at least one of the
 * required roles. Shows a spinner while the session/roles are loading
 * and redirects to `fallback` (default "/") if access is denied.
 *
 * Sign-in redirect is handled separately by the route-level guard.
 */
export function RoleGuard({ roles, children, fallback = "/" }: Props) {
  const { status, user } = useAuthState();

  if (status === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  const has = user?.roles?.some((r) => roles.includes(r)) ?? false;
  if (!has) return <Navigate to={fallback} />;

  return <>{children}</>;
}
