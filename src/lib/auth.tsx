// Back-compat shim — re-exports the new auth module so existing imports keep working.
export { AuthProvider } from "./auth/AuthProvider";
export { useAuth } from "./auth/useAuth";
/** Kept for legacy call sites — always true now that we own the auth flow. */
export const clerkConfigured = true;
