import { redirect } from "@tanstack/react-router";
import { authStore } from "./store";

/** Use inside a route's beforeLoad to require authentication. */
export function requireAuth(location: { href: string }) {
  const { status } = authStore.getState();
  // While bootstrapping, allow render — the component-level guard will hold UI.
  // Once we know we're unauthenticated, redirect to /sign-in with redirect-back.
  if (status === "unauthenticated") {
    throw redirect({
      to: "/sign-in",
      search: { redirect: location.href },
    });
  }
}
