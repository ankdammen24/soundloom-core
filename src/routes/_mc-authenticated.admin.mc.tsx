import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useMcAuth } from "@/lib/mc-auth/useMcAuth";

export const Route = createFileRoute("/_mc-authenticated/admin/mc")({
  component: McAdminPage,
});

function McAdminPage() {
  const { user, logout } = useMcAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Soundloom · Admin
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight">
            <ShieldCheck className="h-7 w-7 text-primary" /> Media Catalog Admin
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Protected area. Authenticated via the media-catalog backend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Sign out
        </button>
      </header>

      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Signed-in user</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Name</dt>
            <dd className="mt-1 font-medium">{user?.displayName ?? user?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">User ID</dt>
            <dd className="mt-1 font-mono text-xs">{user?.id ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Roles</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {(user?.roles ?? []).length === 0 ? (
                <span className="text-muted-foreground">none</span>
              ) : (
                user!.roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary"
                  >
                    {r}
                  </span>
                ))
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
