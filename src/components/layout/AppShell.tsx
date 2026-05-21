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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlayerBar } from "@/features/player/PlayerBar";
import { AudioEngine } from "@/features/player/AudioEngine";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/artists", label: "Artists", icon: Users },
  { to: "/releases", label: "Releases", icon: Send },
  { to: "/tracks", label: "Tracks", icon: Music2 },
  { to: "/uploads", label: "Uploads", icon: Upload },
  { to: "/status", label: "Platform Status", icon: Activity },
] as const;

export function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-sidebar px-4 py-3">
        <div>Soundloom</div>
        <button onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Menu />}</button>
      </header>
      <div className="md:grid md:grid-cols-[220px_1fr]">
        <aside className={cn("border-r bg-sidebar", open ? "block" : "hidden md:block")}>
          <nav className="p-3">
            {nav.map((i) => {
              const I = i.icon;
              const active = location.pathname === i.to;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded px-3 py-2",
                    active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "",
                  )}
                >
                  {" "}
                  <I className="h-4 w-4" />
                  {i.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-3">
            {clerkConfigured ? (
              <>
                <SignedOut>
                  <div className="space-y-1">
                    <Link to="/sign-in" className="flex items-center gap-2 rounded px-3 py-2">
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </Link>
                    <Link to="/sign-up" className="flex items-center gap-2 rounded px-3 py-2">
                      <UserPlus className="h-4 w-4" />
                      Sign up
                    </Link>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="space-y-1">
                    <Link to="/dashboard" className="flex items-center gap-2 rounded px-3 py-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2 rounded px-3 py-2">
                      <UserCircle2 className="h-4 w-4" />
                      Profile
                    </Link>
                    <div className="px-3 py-2">
                      <UserButton />
                    </div>
                  </div>
                </SignedIn>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Clerk inte konfigurerad. S\u00e4tt <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> i <code className="font-mono">.env</code>.
              </div>
            )}
          </div>
        </aside>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <AudioEngine />
      <PlayerBar />
    </div>
  );
}
