import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Disc3, Music2, Send, ListMusic, Scale, Upload, Activity, Settings as SettingsIcon, Search, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/artists", label: "Artists", icon: Users },
  { to: "/albums", label: "Albums", icon: Disc3 },
  { to: "/tracks", label: "Tracks", icon: Music2 },
  { to: "/releases", label: "Releases", icon: Send },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/rights", label: "Rights & ownership", icon: Scale },
  { to: "/uploads", label: "Uploads", icon: Upload },
  { to: "/processing", label: "Processing status", icon: Activity },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <Brand />
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 hover:bg-sidebar-accent"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="md:grid md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:flex md:flex-col",
            open ? "block" : "hidden md:flex",
          )}
        >
          <div className="hidden md:flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
            <Brand />
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
            <div className="font-medium text-sidebar-foreground">Media Rosenqvist</div>
            <div>Music Catalog Core · v0.1</div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">
          <div className="hidden md:flex items-center gap-3 border-b border-border bg-card/50 px-6 py-3">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search catalog…"
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-success" /> Catalog API: ready
            </div>
          </div>
          <div className="px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">M</div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">Music Catalog Core</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Media Rosenqvist</div>
      </div>
    </div>
  );
}
