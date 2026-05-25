import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { LogOut, Mail, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, logoutRedirect } = useAuth();

  const displayName = user?.displayName ?? user?.name ?? user?.email ?? "Your account";

  return (
    <>
      <PageHeader title="Profile" description="Ditt Media Rosenqvist Connect-konto." />
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{displayName}</div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {user?.email ?? "—"}
            </div>
            {user?.roles && user.roles.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {user.roles.map((r) => (
                  <span key={r} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{r}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Btn variant="outline" onClick={() => void logoutRedirect()}>
            <LogOut className="h-4 w-4" /> Logga ut
          </Btn>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Lösenord och profildata hanteras i Media Rosenqvist Connect.
        </p>
      </section>
    </>
  );
}
