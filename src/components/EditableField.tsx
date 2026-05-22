import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number | null | undefined;
  onSave: (v: string) => Promise<unknown> | unknown;
  type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  monospace?: boolean;
};

export function EditableField({
  label,
  value,
  onSave,
  type = "text",
  options,
  placeholder,
  className,
  monospace,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value ?? ""));
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    if (saving) return;
    if (draft === String(value ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }
  function cancel() {
    setDraft(String(value ?? ""));
    setEditing(false);
    setError(null);
  }

  return (
    <div className={cn("group rounded-md border border-transparent hover:border-border p-2 -mx-2 transition-colors", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
            aria-label={`Edit ${label}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-1 flex items-center gap-1">
          {type === "select" ? (
            <select
              ref={(el) => {
                inputRef.current = el;
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commit();
                if (e.key === "Escape") cancel();
              }}
              className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
              disabled={saving}
            >
              {options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              ref={(el) => {
                inputRef.current = el;
              }}
              type={type}
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => void commit()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commit();
                if (e.key === "Escape") cancel();
              }}
              className={cn(
                "flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm",
                monospace && "font-mono",
              )}
              disabled={saving}
            />
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void commit()}
            className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"
            disabled={saving}
            aria-label="Save"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            className="grid h-7 w-7 place-items-center rounded-md border border-input"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          className={cn(
            "mt-1 cursor-text text-sm",
            monospace && "font-mono",
            value == null || value === "" ? "text-muted-foreground italic" : "text-foreground",
          )}
        >
          {value == null || value === "" ? placeholder ?? "—" : String(value)}
        </div>
      )}
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </div>
  );
}
