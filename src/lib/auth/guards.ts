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
