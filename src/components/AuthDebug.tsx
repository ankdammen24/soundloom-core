import { useAuthState } from "@/lib/auth/store";

export function AuthDebug() {
  const { status, user } = useAuthState();

  if (import.meta.env.PROD) return null;

  return (
    <div className="mt-4 rounded border border-dashed p-3 text-xs text-muted-foreground">
      <p>Auth debug (dev only) — Media Rosenqvist Connect</p>
      <p>status: {status}</p>
      <p>userId: {user?.id ?? "-"}</p>
      <p>email: {user?.email ?? "-"}</p>
      <p>roles: {user?.roles?.join(", ") || "-"}</p>
      <p>permissions: {user?.permissions?.join(", ") || "-"}</p>
    </div>
  );
}
