import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { useEffect, type ReactNode } from "react";
import { setApiTokenGetter } from "./api";

const PUBLISHABLE_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim();

export const clerkConfigured = Boolean(PUBLISHABLE_KEY?.startsWith("pk_"));

function ApiTokenBridge() {
  const { getToken, isLoaded } = useAuth();
  useEffect(() => {
    if (!isLoaded) return;
    setApiTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
    return () => setApiTokenGetter(null);
  }, [isLoaded, getToken]);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // When no Clerk key is configured, render children directly so the app stays usable.
  if (!clerkConfigured) {
    return <>{children}</>;
  }
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ApiTokenBridge />
      {children}
    </ClerkProvider>
  );
}
