import { cn } from "@/lib/utils";

export type Range = "1h" | "24h" | "7d" | "30d";
const RANGES: Range[] = ["1h", "24h", "7d", "30d"];

export function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
            value === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
