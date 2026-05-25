import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/lib/auth/store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/debug/token")({
  component: TokenDebugPage,
});

type Claims = Record<string, unknown> & {
  aud?: string | string[]; iss?: string; sub?: string; email?: string;
  exp?: number; iat?: number; role?: string;
};

function decodeJwt(token: string): Claims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(atob(padded).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")));
  } catch { return null; }
}

function fmtTime(epoch?: number) {
  return epoch ? new Date(epoch * 1000).toISOString() : "-";
}

function TokenDebugPage() {
  const { user } = useAuthState();
  const [token, setToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claims | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token ?? null;
      setToken(t);
      setClaims(t ? decodeJwt(t) : null);
    });
  }, [tick]);

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Token claims</h1>
          <p className="text-sm text-muted-foreground">
            Active user: {user?.email ?? user?.name ?? "-"} ({user?.provider ?? "-"})
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setTick((n) => n + 1)}>
          <RefreshCw className="h-4 w-4" /> <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium">Key claims</h2>
        {claims ? (
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">aud</dt><dd className="font-mono break-all">{JSON.stringify(claims.aud) ?? "-"}</dd>
            <dt className="text-muted-foreground">iss</dt><dd className="font-mono break-all">{claims.iss ?? "-"}</dd>
            <dt className="text-muted-foreground">sub</dt><dd className="font-mono break-all">{claims.sub ?? "-"}</dd>
            <dt className="text-muted-foreground">email</dt><dd className="font-mono break-all">{claims.email ?? "-"}</dd>
            <dt className="text-muted-foreground">role</dt><dd className="font-mono break-all">{claims.role ?? "-"}</dd>
            <dt className="text-muted-foreground">iat</dt><dd className="font-mono">{fmtTime(claims.iat)}</dd>
            <dt className="text-muted-foreground">exp</dt><dd className="font-mono">{fmtTime(claims.exp)}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> No token in session.
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
        <textarea readOnly value={token ?? ""} className="w-full h-32 text-xs font-mono bg-muted rounded p-2" />
      </section>
    </div>
  );
}
