import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/Skeleton";

export type CatalogColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** value used for sorting + searching */
  value?: (row: T) => string | number | null | undefined;
  className?: string;
  sortable?: boolean;
  /** hide column below this breakpoint */
  hideBelow?: "sm" | "md" | "lg" | "xl";
};

export function CatalogTable<T extends { id: string }>({
  rows,
  columns,
  isLoading,
  emptyMessage = "No records yet",
  emptyAction,
  initialSort,
  searchPlaceholder = "Search…",
  toolbarExtras,
  onRowClick,
}: {
  rows: T[] | undefined;
  columns: CatalogColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  searchPlaceholder?: string;
  toolbarExtras?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    let result = rows;
    if (needle) {
      result = rows.filter((r) =>
        columns.some((c) => {
          const v = c.value ? c.value(r) : undefined;
          if (v == null) return false;
          return String(v).toLowerCase().includes(needle);
        }),
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.value) {
        result = [...result].sort((a, b) => {
          const av = col.value!(a);
          const bv = col.value!(b);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return sort.dir === "asc" ? -1 : 1;
          if (av > bv) return sort.dir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return result;
  }, [rows, q, sort, columns]);

  function toggleSort(key: string) {
    setSort((curr) => {
      if (!curr || curr.key !== key) return { key, dir: "asc" };
      if (curr.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const hideClass = (h?: CatalogColumn<T>["hideBelow"]) =>
    h ? `hidden ${h}:table-cell` : "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {toolbarExtras}
        <div className="ml-auto text-xs text-muted-foreground">
          {isLoading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={columns.length} />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                <tr>
                  {columns.map((c) => {
                    const sortable = c.sortable !== false && !!c.value;
                    const active = sort?.key === c.key;
                    const SortIcon = active ? (sort!.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th
                        key={c.key}
                        className={cn("px-4 py-2.5 text-left font-medium", c.className, hideClass(c.hideBelow))}
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(c.key)}
                            className={cn(
                              "inline-flex items-center gap-1 hover:text-foreground transition-colors",
                              active && "text-foreground",
                            )}
                          >
                            {c.header}
                            <SortIcon className="h-3 w-3 opacity-60" />
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                      <Inbox className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        {q.trim() ? `No matches for "${q}"` : emptyMessage}
                      </div>
                      {!q.trim() && emptyAction && <div className="mt-3">{emptyAction}</div>}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className={cn("transition-colors hover:bg-muted/30", onRowClick && "cursor-pointer")}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={cn("px-4 py-2.5 align-middle", c.className, hideClass(c.hideBelow))}>
                          {c.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
