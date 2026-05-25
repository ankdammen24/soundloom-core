import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/Btn";
import { LogOut, Mail, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate({ to: "/" });
  }

  const displayName = user?.displayName ?? user?.name ?? user?.email ?? "Your account";

  return (
    <>
      <PageHeader title="Profile" description="Your Catalogus Musicus account." />
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
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Btn variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Btn>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Password and email management will appear here once the backend exposes the corresponding endpoints.
        </p>
      </section>
    </>
  );
}
