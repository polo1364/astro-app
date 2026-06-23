import type { NatalAnalysisReport, NatalResult } from "@/lib/mock/natal";

const FALLBACK_ANALYSIS: NatalAnalysisReport = {
  section1Validity: {
    title: "一、資料完整性檢查",
    lines: ["- 後端版本過舊或未啟動，無法取得分析資料"],
    text: "## 一、資料完整性檢查\n- 後端版本過舊或未啟動，無法取得分析資料",
  },
  section2CoreSummary: {
    title: "二、命盤核心摘要",
    lines: ["- 請在 backend 目錄執行：py -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"],
    text: "## 二、命盤核心摘要\n- 請重新啟動後端（port 8001）後再計算命盤",
  },
  sectionsAi: null,
};

function pickSection(
  raw: Record<string, unknown> | undefined,
  camel: string,
  snake: string,
): NatalAnalysisReport["section1Validity"] | undefined {
  if (!raw) return undefined;
  const sec = (raw[camel] ?? raw[snake]) as NatalAnalysisReport["section1Validity"] | undefined;
  if (!sec || typeof sec !== "object") return undefined;
  if (!sec.title && !sec.text) return undefined;
  return sec;
}

export function isStaleBackendResponse(raw: Record<string, unknown>): boolean {
  const hasPlanets = Array.isArray(raw.planets) && raw.planets.length > 0;
  const chartJson = (raw.chartJson ?? raw.chart_json) as Record<string, unknown> | undefined;
  const hasChartJson = !!chartJson && Object.keys(chartJson).length > 0;
  const analysisRaw = raw.analysis as Record<string, unknown> | undefined;
  const hasAnalysis =
    !!pickSection(analysisRaw, "section1Validity", "section1_validity")
    && !!pickSection(analysisRaw, "section2CoreSummary", "section2_core_summary");
  return hasPlanets && (!hasChartJson || !hasAnalysis);
}

/** 相容後端 snake_case；舊版後端則回傳提示訊息 */
export function normalizeNatalResult(raw: Record<string, unknown>): NatalResult {
  const analysisRaw = raw.analysis as Record<string, unknown> | undefined;
  const section1 = pickSection(analysisRaw, "section1Validity", "section1_validity");
  const section2 = pickSection(analysisRaw, "section2CoreSummary", "section2_core_summary");

  const chartJson = (raw.chartJson ?? raw.chart_json ?? {}) as Record<string, unknown>;

  const analysis: NatalAnalysisReport =
    section1 && section2
      ? {
          section1Validity: section1,
          section2CoreSummary: section2,
          sectionsAi: (analysisRaw?.sectionsAi ?? analysisRaw?.sections_ai ?? null) as
            | string
            | null,
        }
      : FALLBACK_ANALYSIS;

  return {
    ...(raw as unknown as NatalResult),
    chartJson,
    analysis,
  };
}
