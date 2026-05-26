import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Soundloom · Admin
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" /> Admin area
          </h1>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </header>

      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Signed in as</h2>
        <p className="mt-2 text-lg font-medium">
          {user?.displayName ?? user?.name ?? user?.email ?? user?.id}
        </p>
        {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
        {user?.roles && user.roles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.roles.map((r) => (
              <span
                key={r}
                className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Admin tools will appear here as they come online. Authentication is provided by the
        media-catalog backend at <code>api.mediarosenqvist.com</code>.
      </section>
    </div>
  );
}
