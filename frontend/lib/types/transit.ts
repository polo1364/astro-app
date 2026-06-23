import type { NatalAnalysisReport, NatalResult } from "@/lib/mock/natal";

export interface TransitAspect {
  transitPlanet: string;
  type: string;
  natalPlanet: string;
  natalPoint?: string;
  orb: string;
  orbDeg?: number;
  strength: "強" | "中" | "弱";
  applying: boolean;
  priority?: "high" | "medium" | "low";
  inPrimary?: boolean;
}

export interface TransitPlanet {
  name: string;
  sign: string;
  degree: string;
  retrograde: boolean;
  longitude?: number;
  natalHouse?: number | null;
}

export interface TransitAnalysisSection {
  title: string;
  lines?: string[];
  text: string;
  evidence?: string[];
}

export interface TransitAnalysisReport {
  section1Validity: TransitAnalysisSection;
  section2Highlights: TransitAnalysisSection;
  section3LongTerm: TransitAnalysisSection;
  section4MidTerm: TransitAnalysisSection;
  section5ShortTerm: TransitAnalysisSection;
  section6LifeAreas: TransitAnalysisSection;
  section7Timing: TransitAnalysisSection;
  section8Advice: TransitAnalysisSection;
  section9Summary: TransitAnalysisSection;
  sectionsAi?: string | null;
}

export interface TransitResult {
  natal: NatalResult;
  transitDate: string;
  transitTime?: string | null;
  transitPlanets: TransitPlanet[];
  transitAspects: TransitAspect[];
  transitAspectsAppendix?: TransitAspect[];
  transitChartJson: Record<string, unknown>;
  analysis: TransitAnalysisReport;
}
