import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/lib/auth/store";
import { getRawSession, getCurrentUser } from "@/lib/connectAuth";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/debug/token")({
  component: TokenDebugPage,
});

function fmtTime(epoch?: number) {
  if (!epoch) return "-";
  return new Date(epoch * 1000).toISOString();
}

function TokenDebugPage() {
  const { user } = useAuthState();
  const [tick, setTick] = useState(0);
  const session = getRawSession();
  const current = getCurrentUser();
  const claims = current?.claims ?? null;
  const token = session?.accessToken ?? null;

  return (
    <div key={tick} className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Token claims</h1>
          <p className="text-sm text-muted-foreground">
            Active user: {user?.email ?? user?.name ?? "-"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setTick((n) => n + 1)}>
          <RefreshCw className="h-4 w-4" />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium">Key claims</h2>
        {claims ? (
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">aud</dt>
            <dd className="font-mono break-all">{JSON.stringify(claims.aud) ?? "-"}</dd>
            <dt className="text-muted-foreground">iss</dt>
            <dd className="font-mono break-all">{claims.iss ?? "-"}</dd>
            <dt className="text-muted-foreground">scp / scope</dt>
            <dd className="font-mono break-all">{claims.scp ?? claims.scope ?? "-"}</dd>
            <dt className="text-muted-foreground">permissions</dt>
            <dd className="font-mono break-all">{JSON.stringify(current?.permissions ?? [])}</dd>
            <dt className="text-muted-foreground">roles</dt>
            <dd className="font-mono break-all">{JSON.stringify(current?.roles ?? [])}</dd>
            <dt className="text-muted-foreground">sub</dt>
            <dd className="font-mono break-all">{claims.sub ?? "-"}</dd>
            <dt className="text-muted-foreground">email</dt>
            <dd className="font-mono break-all">{claims.email ?? claims.preferred_username ?? "-"}</dd>
            <dt className="text-muted-foreground">iat</dt>
            <dd className="font-mono">{fmtTime(claims.iat)}</dd>
            <dt className="text-muted-foreground">nbf</dt>
            <dd className="font-mono">{fmtTime(claims.nbf)}</dd>
            <dt className="text-muted-foreground">exp</dt>
            <dd className="font-mono">{fmtTime(claims.exp)}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> No token in storage.
          </p>
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">Full payload</h2>
        <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-[320px]">
          {claims ? JSON.stringify(claims, null, 2) : "(no token)"}
        </pre>
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">Raw access_token</h2>
        <textarea
          readOnly
          value={token ?? ""}
          className="w-full h-32 text-xs font-mono bg-muted rounded p-2"
        />
      </section>
    </div>
  );
}
