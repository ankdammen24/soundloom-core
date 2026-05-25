import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/useAuth";
import {
  LayoutDashboard, Users, Send, Music2, Upload, Cpu, ClipboardCheck,
  KeyRound, Settings as SettingsIcon, BookOpen, UserCircle2, LogIn, UserPlus,
  Menu, X, LogOut, Music2 as Brand, ShieldCheck, Bug,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const ORG_NAME = "Media Rosenqvist";

type NavLink = { to: string; label: string; icon: typeof Users; roles?: string[] };

const PRIMARY: NavLink[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/artists", label: "Artists", icon: Users },
  { to: "/releases", label: "Releases", icon: Send },
  { to: "/tracks", label: "Tracks", icon: Music2 },
  { to: "/uploads", label: "Upload", icon: Upload },
];

const OPS: NavLink[] = [
  { to: "/processing", label: "Processing", icon: Cpu, roles: ["admin", "editor"] },
  { to: "/review", label: "Review", icon: ClipboardCheck, roles: ["admin", "editor"] },
  { to: "/api-keys", label: "API keys", icon: KeyRound, roles: ["admin"] },
  { to: "/admin/users", label: "Users & roles", icon: ShieldCheck, roles: ["admin"] },
  { to: "/admin/debug", label: "Auth debug", icon: Bug, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: SettingsIcon, roles: ["admin"] },
  { to: "/system-overview", label: "System Overview", icon: BookOpen, roles: ["admin"] },
];

function NavItem({ to, label, Icon, active, onClick }: {
  to: string; label: string; Icon: typeof Users; active: boolean; onClick?: () => void;
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

function filterByRole(items: NavLink[], roles: string[]): NavLink[] {
  return items.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)));
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const roles = user?.roles ?? [];
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");
  const primaryNav = filterByRole(PRIMARY, roles);
  const opsNav = filterByRole(OPS, roles);

  async function onLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Brand className="h-4 w-4" />
          </span>
          Music Catalog
        </div>
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[260px_1fr] md:gap-2 md:p-2">
        <aside className={cn(
          "md:sticky md:top-2 md:h-[calc(100vh-1rem)] md:rounded-xl bg-sidebar text-sidebar-foreground overflow-y-auto flex flex-col",
          open ? "block" : "hidden md:flex",
        )}>
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
            {primaryNav.map((i) => (
              <NavItem key={i.to} to={i.to} label={i.label} Icon={i.icon} active={isActive(i.to)} onClick={() => setOpen(false)} />
            ))}
          </nav>

          {opsNav.length > 0 && (
            <div className="mx-2 my-2 rounded-lg bg-sidebar-accent/40 p-2">
              <div className="px-2 py-1 text-xs uppercase tracking-wider text-sidebar-foreground/60">Operations</div>
              <nav className="mt-1 space-y-1">
                {opsNav.map((i) => (
                  <NavItem key={i.to} to={i.to} label={i.label} Icon={i.icon} active={isActive(i.to)} onClick={() => setOpen(false)} />
                ))}
              </nav>
            </div>
          )}

          <div className="mt-auto border-t border-sidebar-border p-3 space-y-2">
            <div className="flex items-center justify-center"><ThemeToggle /></div>
            {!isAuthenticated ? (
              <div className="space-y-1">
                <NavItem to="/sign-in" label="Sign in" Icon={LogIn} active={isActive("/sign-in")} />
                <NavItem to="/sign-up" label="Sign up" Icon={UserPlus} active={isActive("/sign-up")} />
              </div>
            ) : (
              <div className="space-y-1">
                <NavItem to="/profile" label="Profile" Icon={UserCircle2} active={isActive("/profile")} />
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                >
                  <LogOut className="h-5 w-5" /> <span>Sign out</span>
                </button>
                <div className="px-3 pt-2 space-y-1.5">
                  <div className="text-xs font-medium text-sidebar-foreground truncate">
                    {user?.displayName ?? user?.email}
                  </div>
                  {user?.email && (
                    <div className="text-[11px] text-sidebar-foreground/60 truncate">{user.email}</div>
                  )}
                  <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{ORG_NAME}</div>
                  {roles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {roles.map((r) => (
                        <span key={r} className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="md:rounded-xl md:bg-card md:min-h-[calc(100vh-1rem)] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
