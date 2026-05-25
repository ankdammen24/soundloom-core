import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const opts: { value: Theme; Icon: typeof Sun; label: string }[] = [
    { value: "light", Icon: Sun, label: "Light" },
    { value: "dark", Icon: Moon, label: "Dark" },
    { value: "system", Icon: Monitor, label: "System" },
  ];
  return (
    <div
      className={cn("inline-flex rounded-full bg-sidebar-accent/40 p-1", className)}
      role="radiogroup"
      aria-label="Theme"
    >
      {opts.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full transition-colors",
            theme === value
              ? "bg-primary text-primary-foreground shadow"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
