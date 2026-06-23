import type { Aspect } from "@/lib/mock/natal";

const STRENGTH_ORDER: Record<Aspect["strength"], number> = {
  強: 0,
  中: 1,
  弱: 2,
};

/** Parse orb strings like `3°46′` or `5°43'` to decimal degrees. */
export function parseOrbDegrees(orb: string): number {
  const normalized = orb.replace(/′/g, "'").replace(/°/g, " ");
  const parts = normalized.trim().split(/\s+/);
  const deg = parseFloat(parts[0] ?? "0") || 0;
  const minPart = parts[1]?.replace(/'/g, "") ?? "0";
  const min = parseFloat(minPart) || 0;
  return deg + min / 60;
}

export function sortAspects(aspects: Aspect[]): Aspect[] {
  return [...aspects].sort((a, b) => {
    const s = STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength];
    if (s !== 0) return s;
    return parseOrbDegrees(a.orb) - parseOrbDegrees(b.orb);
  });
}

export type AspectStrengthFilter = "all" | "strong-medium";

export function filterAspects(
  aspects: Aspect[],
  strengthFilter: AspectStrengthFilter,
  typeFilter: string | null,
): Aspect[] {
  return aspects.filter((a) => {
    if (strengthFilter === "strong-medium" && a.strength === "弱") return false;
    if (typeFilter && a.type !== typeFilter) return false;
    return true;
  });
}

export const ASPECT_TYPE_OPTIONS = ["合相", "六分", "四分", "三分", "對分"] as const;
