import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Music2,
  LogIn,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Music2 as Brand,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

const ORG_NAME = "Media Rosenqvist";

type NavLink = { to: string; label: string; icon: typeof Music2 };

const PUBLIC_NAV: NavLink[] = [
  { to: "/", label: "Home", icon: Brand },
  { to: "/catalog", label: "Catalog", icon: Music2 },
];

function NavItem({
  to,
  label,
  Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  Icon: typeof Music2;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppShell() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to + "/"));

  const displayName = user?.displayName ?? user?.name ?? user?.email ?? user?.id;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Brand className="h-4 w-4" />
          </span>
          Music Catalog
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <span className="text-xs text-foreground/80">
              <UserCircle2 className="mr-1 inline h-4 w-4" />
              {displayName}
            </span>
          ) : (
            <Link to="/login" className="text-xs font-medium text-primary">
              Sign in
            </Link>
          )}
          <button onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className="md:grid md:grid-cols-[260px_1fr] md:gap-2 md:p-2">
        <aside
          className={cn(
            "md:sticky md:top-2 md:h-[calc(100vh-1rem)] md:rounded-xl bg-sidebar text-sidebar-foreground overflow-y-auto flex flex-col",
            open ? "block" : "hidden md:flex",
          )}
        >
          <div className="px-5 pt-5 pb-3 hidden md:block">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <Brand className="h-4 w-4" />
              </span>
              <div>
                <div className="text-base font-bold tracking-tight">Music Catalog</div>
                <div className="text-[11px] text-sidebar-foreground/60">{ORG_NAME}</div>
              </div>
            </div>
          </div>

          <nav className="px-2 py-2 space-y-1">
            {PUBLIC_NAV.map((i) => (
              <NavItem
                key={i.to}
                to={i.to}
                label={i.label}
                Icon={i.icon}
                active={isActive(i.to)}
                onClick={() => setOpen(false)}
              />
            ))}
            {isAuthenticated && (
              <NavItem
                to="/admin"
                label="Admin"
                Icon={ShieldCheck}
                active={isActive("/admin")}
                onClick={() => setOpen(false)}
              />
            )}
          </nav>

          <div className="mt-auto border-t border-sidebar-border p-3 space-y-2">
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>

            {isAuthenticated && user ? (
              <div className="rounded-md border border-sidebar-border/60 bg-sidebar-accent/30 p-2 text-sidebar-foreground">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                      Signed in
                    </div>
                    <div className="truncate text-xs font-medium">{displayName}</div>
                    {user.email && (
                      <div className="truncate text-[11px] text-sidebar-foreground/60">
                        {user.email}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void logout();
                      setOpen(false);
                    }}
                    title="Sign out"
                    className="rounded p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
                {user.roles && user.roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.roles.map((r: string) => (
                      <span
                        key={r}
                        className="rounded-full bg-sidebar-accent/60 px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </aside>

        <main className="min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
