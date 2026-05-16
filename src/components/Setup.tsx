import { supabaseConfigured } from "@/lib/supabase";
import { AlertTriangle } from "lucide-react";

export function SetupBanner() {
  if (supabaseConfigured) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-5 w-5 text-warning-foreground" />
      <div className="space-y-1">
        <div className="font-semibold text-warning-foreground">Supabase not connected</div>
        <p className="text-warning-foreground/90">
          Set <code className="font-mono">VITE_SUPABASE_URL</code> and{" "}
          <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in your environment, then
          run <code className="font-mono">supabase-schema.sql</code> in your Supabase SQL editor.
          Visit <a className="underline" href="/settings">Settings</a> for details.
        </p>
      </div>
    </div>
  );
}

export function LoadingRows({ cols = 6, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-4"><div className="h-3 w-3/4 rounded bg-muted" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ErrorRow({ cols, error }: { cols: number; error: unknown }) {
  const msg = error instanceof Error ? error.message : "Failed to load.";
  return (
    <tr><td colSpan={cols} className="p-6 text-center text-sm text-destructive">{msg}</td></tr>
  );
}

export function EmptyRow({ cols, label = "No results." }: { cols: number; label?: string }) {
  return (
    <tr><td colSpan={cols} className="p-8 text-center text-sm text-muted-foreground">{label}</td></tr>
  );
}
