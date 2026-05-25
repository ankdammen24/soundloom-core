import { redirect } from "@tanstack/react-router";
import { authStore } from "./store";

/** Use inside a route's beforeLoad to require authentication. */
export function requireAuth(location: { href: string }) {
  const { status } = authStore.getState();
  if (status === "unauthenticated") {
    throw redirect({
      to: "/sign-in",
      search: { redirect: location.href },
    });
  }
}

/**
 * Require one of the given roles. Unauthenticated → /sign-in.
 * Authenticated but missing role → /forbidden.
 * While bootstrapping the layout shows a spinner and the guard re-runs.
 */
export function requireRole(roles: string[], location: { href: string }) {
  const { status, user } = authStore.getState();
  if (status === "unauthenticated") {
    throw redirect({ to: "/sign-in", search: { redirect: location.href } });
  }
  if (status === "authenticated") {
    const has = user?.roles?.some((r) => roles.includes(r)) ?? false;
    if (!has) {
      throw redirect({ to: "/forbidden" });
    }
  }
}
