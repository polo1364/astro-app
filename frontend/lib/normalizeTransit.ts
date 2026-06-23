import type { TransitAnalysisReport, TransitResult } from "@/lib/types/transit";
import { isStaleBackendResponse, normalizeNatalResult } from "@/lib/normalizeNatal";
import { sanitizeTransitAiText } from "@/lib/utils/sanitizeTransitAiText";

const SECTION_KEYS: [keyof TransitAnalysisReport, string, string][] = [
  ["section1Validity", "section1Validity", "section1_validity"],
  ["section2Highlights", "section2Highlights", "section2_highlights"],
  ["section3LongTerm", "section3LongTerm", "section3_long_term"],
  ["section4MidTerm", "section4MidTerm", "section4_mid_term"],
  ["section5ShortTerm", "section5ShortTerm", "section5_short_term"],
  ["section6LifeAreas", "section6LifeAreas", "section6_life_areas"],
  ["section7Timing", "section7Timing", "section7_timing"],
  ["section8Advice", "section8Advice", "section8_advice"],
  ["section9Summary", "section9Summary", "section9_summary"],
];

function pickSection(
  raw: Record<string, unknown> | undefined,
  camel: string,
  snake: string,
): TransitAnalysisReport["section1Validity"] | undefined {
  if (!raw) return undefined;
  const sec = (raw[camel] ?? raw[snake]) as TransitAnalysisReport["section1Validity"] | undefined;
  if (!sec || typeof sec !== "object" || !sec.title) return undefined;
  return sec;
}

function normalizeAspect(raw: Record<string, unknown>): import("@/lib/types/transit").TransitAspect {
  return {
    transitPlanet: String(raw.transitPlanet ?? raw.transit_planet ?? ""),
    type: String(raw.type ?? ""),
    natalPlanet: String(raw.natalPlanet ?? raw.natal_planet ?? raw.natalPoint ?? raw.natal_point ?? ""),
    natalPoint: String(raw.natalPoint ?? raw.natal_point ?? raw.natalPlanet ?? raw.natal_planet ?? ""),
    orb: String(raw.orb ?? ""),
    orbDeg: (raw.orbDeg ?? raw.orb_deg) as number | undefined,
    strength: (raw.strength as "強" | "中" | "弱") ?? "中",
    applying: Boolean(raw.applying),
    priority: (raw.priority as "high" | "medium" | "low") ?? "medium",
    inPrimary: Boolean(raw.inPrimary ?? raw.in_primary ?? true),
  };
}

function normalizePlanet(raw: Record<string, unknown>): import("@/lib/types/transit").TransitPlanet {
  return {
    name: String(raw.name ?? ""),
    sign: String(raw.sign ?? ""),
    degree: String(raw.degree ?? ""),
    retrograde: Boolean(raw.retrograde),
    longitude: (raw.longitude as number) ?? undefined,
    natalHouse: (raw.natalHouse ?? raw.natal_house) as number | null | undefined,
  };
}

export function isStaleTransitResponse(raw: Record<string, unknown>): boolean {
  if (isStaleBackendResponse(raw.natal as Record<string, unknown>)) return true;
  const hasAspects = Array.isArray(raw.transitAspects ?? raw.transit_aspects);
  const tcj = raw.transitChartJson ?? raw.transit_chart_json;
  const hasTcj = !!tcj && typeof tcj === "object" && Object.keys(tcj as object).length > 0;
  const analysis = raw.analysis as Record<string, unknown> | undefined;
  const hasAnalysis = !!pickSection(analysis, "section1Validity", "section1_validity");
  return hasAspects && (!hasTcj || !hasAnalysis);
}

export function normalizeTransitResult(raw: Record<string, unknown>): TransitResult {
  const natal = normalizeNatalResult((raw.natal ?? {}) as Record<string, unknown>);
  const analysisRaw = raw.analysis as Record<string, unknown> | undefined;

  const sections: Record<string, TransitAnalysisReport[keyof TransitAnalysisReport]> = {};
  for (const [key, camel, snake] of SECTION_KEYS) {
    const sec = pickSection(analysisRaw, camel, snake);
    if (sec) sections[key] = sec;
  }

  const aspectsRaw = (raw.transitAspects ?? raw.transit_aspects ?? []) as Record<string, unknown>[];
  const appendixRaw = (raw.transitAspectsAppendix ?? raw.transit_aspects_appendix ?? []) as Record<
    string,
    unknown
  >[];
  const planetsRaw = (raw.transitPlanets ?? raw.transit_planets ?? []) as Record<string, unknown>[];
  const sectionsAiRaw = (analysisRaw?.sectionsAi ?? analysisRaw?.sections_ai ?? null) as string | null;

  return {
    natal,
    transitDate: String(raw.transitDate ?? raw.transit_date ?? ""),
    transitTime: (raw.transitTime ?? raw.transit_time ?? null) as string | null,
    transitPlanets: planetsRaw.map(normalizePlanet),
    transitAspects: aspectsRaw.map(normalizeAspect),
    transitAspectsAppendix: appendixRaw.map(normalizeAspect),
    transitChartJson: (raw.transitChartJson ?? raw.transit_chart_json ?? {}) as Record<string, unknown>,
    analysis: {
      ...sections,
      sectionsAi: sectionsAiRaw ? sanitizeTransitAiText(sectionsAiRaw) : null,
    } as TransitAnalysisReport,
  };
}
