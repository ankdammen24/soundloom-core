import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, ShieldCheck, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requireRole } from "@/lib/auth/guards";
import {
  APP_ROLES,
  addUserRole,
  listUsersWithRoles,
  removeUserRole,
  type AppRole,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  beforeLoad: ({ location }) => {
    requireRole(["admin"], { href: location.href });
  },
  head: () => ({ meta: [{ title: "Users & roles – Admin" }] }),
  component: AdminUsersPage,
});

const ROLE_STYLES: Record<AppRole, string> = {
  admin: "bg-primary/15 text-primary border-primary/30",
  editor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  artist: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

function RoleBadge({
  role,
  onRemove,
  disabled,
}: {
  role: AppRole;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[role]}`}
    >
      {role}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="ml-0.5 grid h-4 w-4 place-items-center rounded-full hover:bg-foreground/10 disabled:opacity-40"
        aria-label={`Remove ${role}`}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </span>
  );
}

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listUsersWithRoles);
  const addFn = useServerFn(addUserRole);
  const removeFn = useServerFn(removeUserRole);
  const [filter, setFilter] = useState("");
  const [pendingAdd, setPendingAdd] = useState<Record<string, AppRole>>({});

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listFn(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const addMutation = useMutation({
    mutationFn: (input: { user_id: string; role: AppRole }) => addFn({ data: input }),
    onSuccess: (_d, vars) => {
      toast.success(`Added role: ${vars.role}`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to add role"),
  });

  const removeMutation = useMutation({
    mutationFn: (input: { user_id: string; role: AppRole }) => removeFn({ data: input }),
    onSuccess: (_d, vars) => {
      toast.success(`Removed role: ${vars.role}`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to remove role"),
  });

  const rows = usersQuery.data?.users ?? [];
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.display_name ?? "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        description="Hantera vilka roller varje konto har. Ändringar börjar gälla direkt vid nästa inloggning."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Sök på e-post, namn eller ID…"
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {usersQuery.isFetching ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Uppdaterar…
            </span>
          ) : (
            <span>
              {filtered.length} av {rows.length} konton
            </span>
          )}
        </div>
      </div>

      {usersQuery.isLoading ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : usersQuery.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(usersQuery.error as Error)?.message ?? "Kunde inte hämta användare"}
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-muted-foreground">
          Inga konton matchar filtret.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Konto</th>
                <th className="px-4 py-3 font-semibold">Roller</th>
                <th className="px-4 py-3 font-semibold">Senaste inloggning</th>
                <th className="px-4 py-3 font-semibold text-right">Lägg till roll</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const available = APP_ROLES.filter((r) => !u.roles.includes(r));
                const selected = pendingAdd[u.id] ?? available[0];
                const busy =
                  (addMutation.isPending && addMutation.variables?.user_id === u.id) ||
                  (removeMutation.isPending && removeMutation.variables?.user_id === u.id);
                return (
                  <tr key={u.id} className="border-b border-border/60 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground break-all">
                        {u.email ?? u.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">inga roller</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.map((r) => (
                            <RoleBadge
                              key={r}
                              role={r}
                              disabled={busy}
                              onRemove={() => removeMutation.mutate({ user_id: u.id, role: r })}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {available.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3 w-3" /> alla roller
                          </span>
                        ) : (
                          <>
                            <Select
                              value={selected}
                              onValueChange={(v) =>
                                setPendingAdd((p) => ({ ...p, [u.id]: v as AppRole }))
                              }
                            >
                              <SelectTrigger className="h-8 w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {available.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => addMutation.mutate({ user_id: u.id, role: selected })}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" /> Lägg till
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
