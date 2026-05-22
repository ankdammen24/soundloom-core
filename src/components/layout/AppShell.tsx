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
  Boxes,
  Building2,
  Radio,
  Cpu,
  Settings as SettingsIcon,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlayerBar } from "@/features/player/PlayerBar";
import { AudioEngine } from "@/features/player/AudioEngine";
import { ThemeToggle } from "@/components/ThemeToggle";

const mainNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/status", label: "Platform Status", icon: Activity },
] as const;

const workspaceNav = [
  { to: "/processing", label: "Processing", icon: Cpu },
  { to: "/distribution", label: "Distribution", icon: Radio },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const opsNav = [
  { to: "/admin", label: "Admin", icon: ShieldAlert },
] as const;

const libraryNav = [
  { to: "/artists", label: "Artists", icon: Users },
  { to: "/releases", label: "Releases", icon: Send },
  { to: "/tracks", label: "Tracks", icon: Music2 },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/uploads", label: "Uploads", icon: Upload },
] as const;

function NavItem({
  to,
  label,
  Icon,
  active,
  onClick,
  compact,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={compact ? label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
        compact ? "justify-center px-2 py-2" : "px-3 py-2",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary")} />
      {!compact && <span className="truncate">{label}</span>}
    </Link>
  );
}

function NavGroup({
  title,
  Icon,
  items,
  isActive,
  onItemClick,
  compact,
}: {
  title: string;
  Icon: typeof Home;
  items: ReadonlyArray<{ to: string; label: string; icon: typeof Home }>;
  isActive: (to: string) => boolean;
  onItemClick?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="mx-2 lg:mx-3 my-2 rounded-lg bg-sidebar-accent/40 p-2">
      {!compact && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs uppercase tracking-wider text-sidebar-foreground/60">
          <Icon className="h-4 w-4" /> {title}
        </div>
      )}
      <nav className={cn("space-y-1", !compact && "mt-1")}>
        {items.map((i) => (
          <NavItem
            key={i.to}
            to={i.to}
            label={i.label}
            Icon={i.icon}
            active={isActive(i.to)}
            onClick={onItemClick}
            compact={compact}
          />
        ))}
      </nav>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Music2 className="h-4 w-4" />
          </span>
          Catalogus Musicus
        </div>
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[72px_1fr] lg:grid-cols-[260px_1fr] md:gap-2 md:p-2">
        <aside
          className={cn(
            "md:sticky md:top-2 md:h-[calc(100vh-7rem)] md:rounded-xl bg-sidebar text-sidebar-foreground overflow-y-auto flex flex-col",
            open ? "block" : "hidden md:flex",
          )}
        >
          <div className="px-3 lg:px-5 pt-5 pb-3 hidden md:block">
            <div className="flex items-center gap-2 lg:gap-2 justify-center lg:justify-start">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex-shrink-0">
                <Music2 className="h-4 w-4" />
              </span>
              <span className="hidden lg:inline text-lg font-bold tracking-tight">Catalogus Musicus</span>
            </div>
            <p className="hidden lg:block mt-1 pl-11 text-[11px] text-sidebar-foreground/60">
              The modern music catalog and distribution platform
            </p>
          </div>

          <nav className="px-2 py-2 space-y-1">
            {mainNav.map((i) => (
              <div key={i.to}>
                <span className="hidden lg:block">
                  <NavItem to={i.to} label={i.label} Icon={i.icon} active={isActive(i.to)} onClick={() => setOpen(false)} />
                </span>
                <span className="hidden md:block lg:hidden">
                  <NavItem to={i.to} label={i.label} Icon={i.icon} active={isActive(i.to)} onClick={() => setOpen(false)} compact />
                </span>
                <span className="block md:hidden">
                  <NavItem to={i.to} label={i.label} Icon={i.icon} active={isActive(i.to)} onClick={() => setOpen(false)} />
                </span>
              </div>
            ))}
          </nav>

          <div className="hidden lg:block">
            <NavGroup title="Catalog" Icon={Library} items={libraryNav} isActive={isActive} onItemClick={() => setOpen(false)} />
            <NavGroup title="Workspace" Icon={SettingsIcon} items={workspaceNav} isActive={isActive} onItemClick={() => setOpen(false)} />
            <NavGroup title="Operations" Icon={ShieldAlert} items={opsNav} isActive={isActive} onItemClick={() => setOpen(false)} />
          </div>
          <div className="hidden md:block lg:hidden">
            <NavGroup title="Catalog" Icon={Library} items={libraryNav} isActive={isActive} onItemClick={() => setOpen(false)} compact />
            <NavGroup title="Workspace" Icon={SettingsIcon} items={workspaceNav} isActive={isActive} onItemClick={() => setOpen(false)} compact />
            <NavGroup title="Operations" Icon={ShieldAlert} items={opsNav} isActive={isActive} onItemClick={() => setOpen(false)} compact />
          </div>
          <div className="block md:hidden">
            <NavGroup title="Catalog" Icon={Library} items={libraryNav} isActive={isActive} onItemClick={() => setOpen(false)} />
            <NavGroup title="Workspace" Icon={SettingsIcon} items={workspaceNav} isActive={isActive} onItemClick={() => setOpen(false)} />
            <NavGroup title="Operations" Icon={ShieldAlert} items={opsNav} isActive={isActive} onItemClick={() => setOpen(false)} />
          </div>

          <div className="mt-auto border-t border-sidebar-border p-3 space-y-3">
            <div className="hidden lg:flex justify-center">
              <ThemeToggle />
            </div>
            {clerkConfigured ? (
              <>
                <SignedOut>
                  <div className="space-y-1">
                    <div className="hidden lg:block space-y-1">
                      <NavItem to="/sign-in" label="Sign in" Icon={LogIn} active={isActive("/sign-in")} />
                      <NavItem to="/sign-up" label="Sign up" Icon={UserPlus} active={isActive("/sign-up")} />
                    </div>
                    <div className="hidden md:block lg:hidden space-y-1">
                      <NavItem to="/sign-in" label="Sign in" Icon={LogIn} active={isActive("/sign-in")} compact />
                      <NavItem to="/sign-up" label="Sign up" Icon={UserPlus} active={isActive("/sign-up")} compact />
                    </div>
                    <div className="md:hidden space-y-1">
                      <NavItem to="/sign-in" label="Sign in" Icon={LogIn} active={isActive("/sign-in")} />
                      <NavItem to="/sign-up" label="Sign up" Icon={UserPlus} active={isActive("/sign-up")} />
                    </div>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="space-y-1">
                    <div className="hidden lg:block">
                      <NavItem to="/profile" label="Profile" Icon={UserCircle2} active={isActive("/profile")} />
                    </div>
                    <div className="hidden md:block lg:hidden">
                      <NavItem to="/profile" label="Profile" Icon={UserCircle2} active={isActive("/profile")} compact />
                    </div>
                    <div className="md:hidden">
                      <NavItem to="/profile" label="Profile" Icon={UserCircle2} active={isActive("/profile")} />
                    </div>
                    <div className="px-3 py-2 flex justify-center lg:justify-start">
                      <UserButton />
                    </div>
                  </div>
                </SignedIn>
              </>
            ) : (
              <div className="hidden lg:block rounded-md border border-dashed border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
                Clerk inte konfigurerad. Sätt <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> i <code className="font-mono">.env</code>.
              </div>
            )}
          </div>
        </aside>

        <main className="md:rounded-xl md:bg-card md:min-h-[calc(100vh-7rem)] p-4 md:p-6 lg:p-8 overflow-hidden">
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
