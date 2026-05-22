import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "primary" | "warn" | "danger" | "ok";
  children?: ReactNode;
}) {
  const toneClass = {
    default: "border-border",
    primary: "border-primary/30 bg-primary/5",
    warn: "border-amber-500/30 bg-amber-500/5",
    danger: "border-destructive/40 bg-destructive/5",
    ok: "border-emerald-500/30 bg-emerald-500/5",
  }[tone];
  return (
    <div className={cn("rounded-lg border bg-card p-4", toneClass)}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      {children}
    </div>
  );
}
