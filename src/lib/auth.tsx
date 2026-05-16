import { ClerkProvider } from "@clerk/clerk-react";
import type { ReactNode } from "react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  // When no Clerk key is configured, render children directly so the catalog UI stays usable.
  if (!PUBLISHABLE_KEY) {
    return <>{children}</>;
  }
  return <ClerkProvider publishableKey={PUBLISHABLE_KEY}>{children}</ClerkProvider>;
}

export const clerkConfigured = Boolean(PUBLISHABLE_KEY);
