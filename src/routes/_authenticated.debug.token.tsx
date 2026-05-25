import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { acquireAccessToken, apiScopes } from "@/lib/auth/msal";
import { AUTH_API_BASE, fetchMe, type ConnectMe } from "@/lib/auth/connect";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/lib/auth/store";

export const Route = createFileRoute("/_authenticated/debug/token")({
  component: TokenDebugPage,
});

type Claims = Record<string, unknown> & {
  aud?: string | string[];
  scp?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  tid?: string;
  oid?: string;
  sub?: string;
  preferred_username?: string;
  roles?: string[];
};

function decodeJwt(token: string): Claims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as Claims;
  } catch {
    return null;
  }
}

function fmtTime(epoch?: number) {
  if (!epoch) return "-";
  return new Date(epoch * 1000).toISOString();
}

function TokenDebugPage() {
  const { account } = useAuthState();
  const [token, setToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claims | null>(null);
  const [me, setMe] = useState<ConnectMe | null>(null);
  const [meStatus, setMeStatus] = useState<number | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setMeError(null);
    setMe(null);
    setMeStatus(null);
    try {
      const t = await acquireAccessToken();
      setToken(t);
      setClaims(t ? decodeJwt(t) : null);
      if (t && AUTH_API_BASE) {
        try {
          const res = await fetch(`${AUTH_API_BASE}/auth/me`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${t}` },
          });
          setMeStatus(res.status);
          if (res.ok) {
            setMe((await res.json()) as ConnectMe);
          } else {
            setMeError(await res.text().catch(() => res.statusText));
          }
        } catch (e) {
          setMeError(e instanceof Error ? e.message : String(e));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Token claims</h1>
          <p className="text-sm text-muted-foreground">
            Active account: {account?.username ?? "-"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void run()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">Requested scopes</h2>
        <code className="block text-xs bg-muted rounded p-2 break-all">
          {apiScopes.join(" ") || "(none)"}
        </code>
      </section>

      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium">Key claims</h2>
        {claims ? (
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">aud</dt>
            <dd className="font-mono break-all">{JSON.stringify(claims.aud) ?? "-"}</dd>
            <dt className="text-muted-foreground">scp</dt>
            <dd className="font-mono break-all">{claims.scp ?? "-"}</dd>
            <dt className="text-muted-foreground">roles</dt>
            <dd className="font-mono break-all">{claims.roles ? JSON.stringify(claims.roles) : "-"}</dd>
            <dt className="text-muted-foreground">iss</dt>
            <dd className="font-mono break-all">{claims.iss ?? "-"}</dd>
            <dt className="text-muted-foreground">tid</dt>
            <dd className="font-mono break-all">{claims.tid ?? "-"}</dd>
            <dt className="text-muted-foreground">oid</dt>
            <dd className="font-mono break-all">{claims.oid ?? "-"}</dd>
            <dt className="text-muted-foreground">sub</dt>
            <dd className="font-mono break-all">{claims.sub ?? "-"}</dd>
            <dt className="text-muted-foreground">preferred_username</dt>
            <dd className="font-mono break-all">{claims.preferred_username ?? "-"}</dd>
            <dt className="text-muted-foreground">iat</dt>
            <dd className="font-mono">{fmtTime(claims.iat)}</dd>
            <dt className="text-muted-foreground">nbf</dt>
            <dd className="font-mono">{fmtTime(claims.nbf)}</dd>
            <dt className="text-muted-foreground">exp</dt>
            <dd className="font-mono">{fmtTime(claims.exp)}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No token acquired.</p>
        )}
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">Full payload</h2>
        <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-[320px]">
          {claims ? JSON.stringify(claims, null, 2) : "(no token)"}
        </pre>
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-medium">
          GET {AUTH_API_BASE || "(VITE_AUTH_API_URL unset)"}/auth/me
        </h2>
        <p className="text-sm text-muted-foreground">
          Status: <span className="font-mono">{meStatus ?? "-"}</span>
        </p>
        {meError && (
          <pre className="text-xs bg-destructive/10 text-destructive rounded p-3 overflow-auto">
            {meError}
          </pre>
        )}
        {me && (
          <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-[320px]">
            {JSON.stringify(me, null, 2)}
          </pre>
        )}
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
