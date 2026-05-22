import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { clerkConfigured } from "@/lib/auth";
import {
  Home,
  Send,
  Users,
  Music2,
  Upload,
  Activity,
  LayoutDashboard,
  UserCircle2,
  LogIn,
  UserPlus,
  Menu,
  X,
  Library,
  Search,
  Compass,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlayerBar } from "@/features/player/PlayerBar";
import { AudioEngine } from "@/features/player/AudioEngine";

const mainNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

const libraryNav = [
  { to: "/artists", label: "Artists", icon: Users },
  { to: "/releases", label: "Releases", icon: Send },
  { to: "/tracks", label: "Tracks", icon: Music2 },
  { to: "/uploads", label: "Uploads", icon: Upload },
  { to: "/status", label: "Platform Status", icon: Activity },
] as const;

function NavItem({
  to,
  label,
  Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "text-primary")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Music2 className="h-4 w-4" />
          </span>
          Soundloom
        </div>
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[260px_1fr] md:gap-2 md:p-2">
        <aside
          className={cn(
            "md:sticky md:top-2 md:h-[calc(100vh-7rem)] md:rounded-xl bg-sidebar text-sidebar-foreground overflow-y-auto",
            open ? "block" : "hidden md:block",
          )}
        >
          <div className="px-5 pt-5 pb-3 hidden md:flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Music2 className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">Soundloom</span>
          </div>

          <nav className="px-2 py-2 space-y-1">
            {mainNav.map((i) => (
              <NavItem
                key={i.to}
                to={i.to}
                label={i.label}
                Icon={i.icon}
                active={isActive(i.to)}
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>

          <div className="mx-3 my-2 rounded-lg bg-sidebar-accent/40 p-2">
            <div className="flex items-center gap-2 px-2 py-1 text-xs uppercase tracking-wider text-sidebar-foreground/60">
              <Library className="h-4 w-4" /> Your library
            </div>
            <nav className="space-y-1 mt-1">
              {libraryNav.map((i) => (
                <NavItem
                  key={i.to}
                  to={i.to}
                  label={i.label}
                  Icon={i.icon}
                  active={isActive(i.to)}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>
          </div>

          <div className="border-t border-sidebar-border mt-3 p-3">
            {clerkConfigured ? (
              <>
                <SignedOut>
                  <div className="space-y-1">
                    <NavItem to="/sign-in" label="Sign in" Icon={LogIn} active={isActive("/sign-in")} />
                    <NavItem to="/sign-up" label="Sign up" Icon={UserPlus} active={isActive("/sign-up")} />
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="space-y-1">
                    <NavItem to="/profile" label="Profile" Icon={UserCircle2} active={isActive("/profile")} />
                    <div className="px-3 py-2">
                      <UserButton />
                    </div>
                  </div>
                </SignedIn>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
                Clerk inte konfigurerad. Sätt <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> i <code className="font-mono">.env</code>.
              </div>
            )}
          </div>
        </aside>

        <main className="md:rounded-xl md:bg-card md:min-h-[calc(100vh-7rem)] p-4 md:p-8 overflow-hidden">
          <div className="md:hidden mb-4 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> Search artists, releases, tracks…
          </div>
          <Outlet />
        </main>
      </div>

      <AudioEngine />
      <PlayerBar />
    </div>
  );
}
