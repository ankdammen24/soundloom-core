import { redirect } from "@tanstack/react-router";
import { mcAuthStore } from "./store";

/** Use in a route's beforeLoad to require media-catalog auth. */
export function requireMcAuth(location: { href: string }) {
  const { status } = mcAuthStore.getState();
  if (status === "unauthenticated") {
    throw redirect({ to: "/mc-login", search: { redirect: location.href } });
  }
}

/** Require one of the given media-catalog roles. */
export function requireMcRole(roles: string[], location: { href: string }) {
  const { status, user } = mcAuthStore.getState();
  if (status === "unauthenticated") {
    throw redirect({ to: "/mc-login", search: { redirect: location.href } });
  }
  if (status === "authenticated") {
    const has = (user?.roles ?? []).some((r) => roles.includes(r));
    if (!has) throw redirect({ to: "/forbidden" });
  }
}
