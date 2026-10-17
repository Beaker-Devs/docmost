import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as svc from "../services/database-service";
import { IDatabase, IDatabaseRow } from "../types/database.types";

export function useDatabaseQuery(databaseId: string) {
  return useQuery({
    queryKey: ["database", databaseId],
    queryFn: () => svc.getDatabase(databaseId),
    enabled: !!databaseId,
  });
}

export function useDatabaseRowsQuery(databaseId: string) {
  return useQuery({
    queryKey: ["database-rows", databaseId],
    queryFn: () => svc.getRows(databaseId),
    enabled: !!databaseId,
  });
}

export function useDatabaseMutations(databaseId: string) {
  const qc = useQueryClient();
  const invalidateMeta = () =>
    qc.invalidateQueries({ queryKey: ["database", databaseId] });
  const invalidateRows = () =>
    qc.invalidateQueries({ queryKey: ["database-rows", databaseId] });

  const createRow = useMutation({
    mutationFn: svc.createRow,
    onSuccess: invalidateRows,
  });
  const updateRow = useMutation({
    mutationFn: svc.updateRow,
    // optimistic cell update for snappy editing
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["database-rows", databaseId] });
      const prev = qc.getQueryData<IDatabaseRow[]>([
        "database-rows",
        databaseId,
      ]);
      qc.setQueryData<IDatabaseRow[]>(["database-rows", databaseId], (old) =>
        (old ?? []).map((r) =>
          r.id === vars.rowId
            ? { ...r, cells: { ...r.cells, ...vars.cells } }
            : r,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(["database-rows", databaseId], ctx.prev);
    },
    onSettled: invalidateRows,
  });
  const deleteRow = useMutation({
    mutationFn: svc.deleteRow,
    onSuccess: invalidateRows,
  });

  const createField = useMutation({
    mutationFn: svc.createField,
    onSuccess: invalidateMeta,
  });
  const updateField = useMutation({
    mutationFn: svc.updateField,
    onSuccess: invalidateMeta,
  });
  const deleteField = useMutation({
    mutationFn: svc.deleteField,
    onSuccess: () => {
      invalidateMeta();
      invalidateRows();
    },
  });

  const createView = useMutation({
    mutationFn: svc.createView,
    onSuccess: invalidateMeta,
  });
  const updateView = useMutation({
    mutationFn: svc.updateView,
    onSuccess: invalidateMeta,
  });
  const deleteView = useMutation({
    mutationFn: svc.deleteView,
    onSuccess: invalidateMeta,
  });

  const updateDatabase = useMutation({
    mutationFn: svc.updateDatabase,
    onSuccess: (data: IDatabase) =>
      qc.setQueryData(["database", databaseId], data),
  });

  return {
    createRow,
    updateRow,
    deleteRow,
    createField,
    updateField,
    deleteField,
    createView,
    updateView,
    deleteView,
    updateDatabase,
  };
}
