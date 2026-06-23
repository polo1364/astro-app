import type { BirthFormData } from "@/lib/data/types";
import { buildNatalLabel } from "@/lib/storage/chartHistoryTypes";

export interface SavedBirthProfile {
  id: string;
  label: string;
  birthForm: BirthFormData;
  savedAt: number;
}

export function buildProfileLabel(birthForm: BirthFormData): string {
  return buildNatalLabel(birthForm);
}
