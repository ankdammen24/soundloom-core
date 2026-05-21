import { useAuth, useUser } from "@clerk/clerk-react";

export function AuthDebug() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  if (import.meta.env.PROD) return null;

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "-";

  return (
    <div className="mt-4 rounded border border-dashed p-3 text-xs text-muted-foreground">
      <p>Auth debug (dev only)</p>
      <p>signedIn: {String(Boolean(isSignedIn))}</p>
      <p>userId: {userId ?? "-"}</p>
      <p>primaryEmail: {primaryEmail}</p>
    </div>
  );
}
