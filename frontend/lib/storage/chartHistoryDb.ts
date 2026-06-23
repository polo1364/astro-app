import { runTransaction, STORES } from "@/lib/storage/db";
import type {
  ChartHistoryRecord,
  ChartKind,
  NatalHistoryRecord,
  TransitHistoryRecord,
} from "./chartHistoryTypes";

export const MAX_HISTORY_PER_KIND = 50;

async function trimKind(kind: ChartKind): Promise<void> {
  const entries = await listChartHistory(kind);
  const overflow = entries.slice(MAX_HISTORY_PER_KIND);
  await Promise.all(overflow.map((entry) => deleteChartHistory(entry.id)));
}

export async function saveChartHistory(
  record:
    | (Omit<NatalHistoryRecord, "id" | "savedAt"> & { id?: string })
    | (Omit<TransitHistoryRecord, "id" | "savedAt"> & { id?: string }),
): Promise<ChartHistoryRecord> {
  const saved: ChartHistoryRecord = {
    ...record,
    id: record.id ?? crypto.randomUUID(),
    savedAt: Date.now(),
  } as ChartHistoryRecord;

  await runTransaction(STORES.chartHistory, "readwrite", (store) => store.put(saved));
  await trimKind(saved.kind);
  return saved;
}

export async function listChartHistory(kind?: ChartKind): Promise<ChartHistoryRecord[]> {
  const all = await runTransaction<ChartHistoryRecord[]>(
    STORES.chartHistory,
    "readonly",
    (store) => store.getAll(),
  );

  return all
    .filter((entry) => (kind ? entry.kind === kind : true))
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function updateChartHistory(
  id: string,
  patch: Partial<Pick<ChartHistoryRecord, "result" | "label" | "birthForm">>,
): Promise<ChartHistoryRecord | undefined> {
  const existing = await getChartHistory(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch, savedAt: Date.now() } as ChartHistoryRecord;
  await runTransaction(STORES.chartHistory, "readwrite", (store) => store.put(updated));
  return updated;
}

export async function getChartHistory(id: string): Promise<ChartHistoryRecord | undefined> {
  return runTransaction<ChartHistoryRecord | undefined>(
    STORES.chartHistory,
    "readonly",
    (store) => store.get(id),
  );
}

export async function deleteChartHistory(id: string): Promise<void> {
  await runTransaction(STORES.chartHistory, "readwrite", (store) => store.delete(id));
}

export async function clearChartHistory(kind?: ChartKind): Promise<void> {
  if (!kind) {
    await runTransaction(STORES.chartHistory, "readwrite", (store) => store.clear());
    return;
  }

  const entries = await listChartHistory(kind);
  await Promise.all(entries.map((entry) => deleteChartHistory(entry.id)));
}
