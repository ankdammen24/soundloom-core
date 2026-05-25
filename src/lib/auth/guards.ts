import { redirect } from "@tanstack/react-router";
import { authStore } from "./store";

/** Use inside a route's beforeLoad to require authentication. */
export function requireAuth(location: { href: string }) {
  const { status } = authStore.getState();
  // While bootstrapping, allow render — the layout shows a spinner until the Supabase session resolves.
  if (status === "unauthenticated") {
    throw redirect({
      to: "/sign-in",
      search: { redirect: location.href },
    });
  }
}

/**
 * Use inside a route's beforeLoad to require one of the given roles.
 * Unauthenticated users are sent to sign-in; authenticated users without
 * a matching role are sent home.
 *
 * While the session is still loading we allow render — the layout shows
 * a spinner and the guard re-runs once roles arrive.
 */
export function requireRole(roles: string[], location: { href: string }) {
  const { status, user } = authStore.getState();
  if (status === "unauthenticated") {
    throw redirect({ to: "/sign-in", search: { redirect: location.href } });
  }
  if (status === "authenticated") {
    const has = user?.roles?.some((r) => roles.includes(r)) ?? false;
    if (!has) {
      throw redirect({ to: "/" });
    }
  }
}
