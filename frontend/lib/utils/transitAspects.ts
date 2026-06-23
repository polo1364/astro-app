import type { TransitAspect } from "@/lib/types/transit";

export type TransitPriorityFilter = "all" | "high" | "primary";
export type TransitStrengthFilter = "all" | "強" | "中" | "弱";

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
const STRENGTH_RANK: Record<string, number> = { 強: 0, 中: 1, 弱: 2 };

export function sortTransitAspects(aspects: TransitAspect[]): TransitAspect[] {
  return [...aspects].sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority ?? "medium"] ?? 2) - (PRIORITY_RANK[b.priority ?? "medium"] ?? 2);
    if (pr !== 0) return pr;
    const sr = (STRENGTH_RANK[a.strength] ?? 2) - (STRENGTH_RANK[b.strength] ?? 2);
    if (sr !== 0) return sr;
    return (a.orbDeg ?? 99) - (b.orbDeg ?? 99);
  });
}

export function filterTransitAspects(
  aspects: TransitAspect[],
  priorityFilter: TransitPriorityFilter,
  strengthFilter: TransitStrengthFilter,
  typeFilter: string | null,
): TransitAspect[] {
  return aspects.filter((a) => {
    if (priorityFilter === "high" && a.priority !== "high") return false;
    if (priorityFilter === "primary" && a.inPrimary === false) return false;
    if (strengthFilter !== "all" && a.strength !== strengthFilter) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    return true;
  });
}

export const TRANSIT_ASPECT_TYPE_OPTIONS = ["合相", "六分", "四分", "三分", "對分"] as const;
