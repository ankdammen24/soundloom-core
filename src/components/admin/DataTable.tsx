import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { Loader2, AlertTriangle, Inbox, PlugZap } from "lucide-react";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  error,
  emptyMessage = "No records",
  expectedUrl,
  rowKey,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  expectedUrl?: string;
  rowKey: (row: T, i: number) => string;
  onRowClick?: (row: T) => void;
}) {
  const notFound = error instanceof ApiError && error.status === 404;
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-2 text-left font-medium ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : notFound ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  <PlugZap className="mx-auto mb-2 h-5 w-5" />
                  Endpoint not yet available
                  {expectedUrl && (
                    <div className="mt-1 font-mono text-[11px]">expected at {expectedUrl}</div>
                  )}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-destructive">
                  <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
                  {(error as Error).message}
                </td>
              </tr>
            ) : !rows || rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-5 w-5" />
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  className={`border-t border-border hover:bg-muted/30 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-2 align-top ${c.className ?? ""}`}>
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
  );
}
