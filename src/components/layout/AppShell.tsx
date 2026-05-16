import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Compass, Send, Users, Music2, Library, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlayerBar } from "@/features/player/PlayerBar";
import { AudioEngine } from "@/features/player/AudioEngine";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/releases", label: "Releases", icon: Send },
  { to: "/artists", label: "Artists", icon: Users },
  { to: "/tracks", label: "Tracks", icon: Music2 },
  { to: "/library", label: "Library", icon: Library },
  { to: "/login", label: "Login", icon: LogIn },
] as const;

export function AppShell(){const location=useLocation(); const [open,setOpen]=useState(false);
return <div className="min-h-screen bg-background text-foreground pb-20"><header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-sidebar px-4 py-3"><div>Soundloom</div><button onClick={()=>setOpen(v=>!v)}>{open?<X/>:<Menu/>}</button></header><div className="md:grid md:grid-cols-[220px_1fr]"><aside className={cn("border-r bg-sidebar",open?"block":"hidden md:block")}><nav className="p-3">{nav.map(i=>{const I=i.icon; const active=location.pathname===i.to; return <Link key={i.to} to={i.to} onClick={()=>setOpen(false)} className={cn("flex items-center gap-2 rounded px-3 py-2",active?"bg-sidebar-primary text-sidebar-primary-foreground":"")}> <I className="h-4 w-4"/>{i.label}</Link>;})}</nav></aside><main className="p-4 md:p-8"><Outlet/></main></div><AudioEngine/><PlayerBar/></div>}
