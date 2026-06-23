import type { BirthFormData } from "@/lib/data/types";
import type { NatalResult } from "@/lib/mock/natal";
import type { TransitResult } from "@/lib/types/transit";

export type ChartKind = "natal" | "transit";

export interface NatalHistoryRecord {
  id: string;
  kind: "natal";
  label: string;
  birthForm: BirthFormData;
  result: NatalResult;
  savedAt: number;
}

export interface TransitHistoryRecord {
  id: string;
  kind: "transit";
  label: string;
  birthForm: BirthFormData;
  transitDate: string;
  transitTime?: string | null;
  result: TransitResult;
  savedAt: number;
}

export type ChartHistoryRecord = NatalHistoryRecord | TransitHistoryRecord;

export function buildNatalLabel(birthForm: BirthFormData): string {
  const name = birthForm.name.trim() || "未命名";
  const time = birthForm.birthTimeUnknown ? "時間不詳" : birthForm.time;
  return `${name} · ${birthForm.date} ${time}`;
}

export function buildTransitLabel(
  birthForm: BirthFormData,
  transitDate: string,
  transitTime?: string | null,
): string {
  const timePart = transitTime ? ` ${transitTime}` : "";
  return `${buildNatalLabel(birthForm)} → ${transitDate}${timePart}`;
}
