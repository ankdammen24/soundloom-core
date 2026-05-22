import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

type OptimisticEntity = { id: string; [k: string]: unknown };

export function useOptimisticListAdd<TVars, TItem extends OptimisticEntity>(
  key: QueryKey,
  mutationFn: (vars: TVars) => Promise<TItem>,
  buildOptimistic: (vars: TVars) => TItem,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<TItem[]>(key);
      const optimistic = buildOptimistic(vars);
      qc.setQueryData<TItem[]>(key, (old) => [optimistic, ...(old ?? [])]);
      return { prev, optimisticId: optimistic.id };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(key, ctx.prev);
    },
    onSuccess: (real, _v, ctx) => {
      qc.setQueryData<TItem[]>(key, (old) =>
        (old ?? []).map((x) => (x.id === ctx?.optimisticId ? real : x)),
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useOptimisticPatch<TItem extends OptimisticEntity>(
  listKey: QueryKey,
  detailKey: QueryKey,
  mutationFn: (patch: Partial<TItem>) => Promise<TItem>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (patch) => {
      await Promise.all([qc.cancelQueries({ queryKey: listKey }), qc.cancelQueries({ queryKey: detailKey })]);
      const prevList = qc.getQueryData<TItem[]>(listKey);
      const prevDetail = qc.getQueryData<TItem>(detailKey);
      if (prevDetail) qc.setQueryData<TItem>(detailKey, { ...prevDetail, ...patch });
      if (prevList) qc.setQueryData<TItem[]>(listKey, prevList.map((it) => (prevDetail && it.id === prevDetail.id ? { ...it, ...patch } : it)));
      return { prevList, prevDetail };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prevList !== undefined) qc.setQueryData(listKey, ctx.prevList);
      if (ctx?.prevDetail !== undefined) qc.setQueryData(detailKey, ctx.prevDetail);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listKey });
      qc.invalidateQueries({ queryKey: detailKey });
    },
  });
}
