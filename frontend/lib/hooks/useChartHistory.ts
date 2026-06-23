"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearChartHistory,
  deleteChartHistory,
  listChartHistory,
  saveChartHistory,
} from "@/lib/storage/chartHistoryDb";
import type { ChartHistoryRecord, ChartKind } from "@/lib/storage/chartHistoryTypes";

export function useChartHistory(kind: ChartKind) {
  const [entries, setEntries] = useState<ChartHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listChartHistory(kind);
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法讀取歷史紀錄");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (record: Parameters<typeof saveChartHistory>[0]) => {
      const saved = await saveChartHistory(record);
      await refresh();
      return saved;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteChartHistory(id);
      await refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    await clearChartHistory(kind);
    await refresh();
  }, [kind, refresh]);

  return useMemo(
    () => ({
      entries,
      loading,
      error,
      refresh,
      save,
      remove,
      clearAll,
    }),
    [entries, loading, error, refresh, save, remove, clearAll],
  );
}
