"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearBirthProfiles,
  deleteBirthProfile,
  listBirthProfiles,
  saveBirthProfile,
} from "@/lib/storage/birthProfileDb";
import type { SavedBirthProfile } from "@/lib/storage/birthProfileTypes";

export function useBirthProfiles() {
  const [entries, setEntries] = useState<SavedBirthProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listBirthProfiles();
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法讀取基本資料");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (record: Parameters<typeof saveBirthProfile>[0]) => {
      const saved = await saveBirthProfile(record);
      await refresh();
      return saved;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteBirthProfile(id);
      await refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    await clearBirthProfiles();
    await refresh();
  }, [refresh]);

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
