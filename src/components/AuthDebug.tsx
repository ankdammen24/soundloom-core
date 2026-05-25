import { useAuthState } from "@/lib/auth/store";

export function AuthDebug() {
  const { status, user } = useAuthState();

  if (import.meta.env.PROD) return null;

  return (
    <div className="mt-4 rounded border border-dashed p-3 text-xs text-muted-foreground">
      <p>Auth debug (dev only)</p>
      <p>status: {status}</p>
      <p>userId: {user?.id ?? "-"}</p>
      <p>email: {user?.email ?? "-"}</p>
    </div>
  );
}
