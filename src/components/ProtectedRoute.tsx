import { Loader2 } from "lucide-react";
import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

type Props = {
  children: ReactNode;
  /** When set, require any of these roles. */
  roles?: string[];
  /** Where to send unauthenticated users (default /login). */
  loginPath?: string;
};

/**
 * Client-side guard for protected routes. Used by route layouts that
 * cannot rely on a synchronous router-context auth state because session
 * restore is asynchronous (refresh token round-trip on boot).
 */
export function ProtectedRoute({ children, roles, loginPath = "/login" }: Props) {
  const { status, isAuthenticated, user } = useAuth();

  if (status === "loading") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined;
    return (
      <Navigate
        to={loginPath as "/login"}
        search={redirect ? ({ redirect } as { redirect: string }) : undefined}
        replace
      />
    );
  }

  if (roles && roles.length > 0) {
    const userRoles = user?.roles ?? [];
    const allowed = userRoles.some((r) => roles.includes(r));
    if (!allowed) return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
