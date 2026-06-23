import { mockNatalResult } from "./natal";
import type { TransitResult } from "@/lib/types/transit";

export type { TransitAspect, TransitPlanet, TransitResult, TransitAnalysisReport } from "@/lib/types/transit";

const fallbackAnalysis: TransitResult["analysis"] = {
  section1Validity: {
    title: "一、資料夠不夠算？",
    text: "後端暫不可用，以下為示範資料。",
    lines: ["示範模式"],
    evidence: [],
  },
  section2Highlights: {
    title: "二、目前最重要的行運",
    text: "木星與金星形成較強相位，適合整理關係與資源。",
    evidence: ["盤面依據：行運木星合相本命金星"],
  },
  section3LongTerm: { title: "三、長期行運", text: "土星相位帶來結構調整。", evidence: [] },
  section4MidTerm: { title: "四、中期行運", text: "—", evidence: [] },
  section5ShortTerm: { title: "五、短期行運", text: "—", evidence: [] },
  section6LifeAreas: { title: "六、人生領域", text: "—", evidence: [] },
  section7Timing: { title: "七、時間點", text: "—", evidence: [] },
  section8Advice: { title: "八、建議", text: "維持節奏、主動溝通。", evidence: [] },
  section9Summary: { title: "九、總結", text: "示範摘要。", evidence: [] },
  sectionsAi: null,
};

export const mockTransitResult: TransitResult = {
  natal: mockNatalResult,
  transitDate: "2026-06-22",
  transitTime: null,
  transitPlanets: [
    { name: "太陽", sign: "巨蟹", degree: "0°48′", retrograde: false, natalHouse: 4 },
    { name: "月亮", sign: "雙魚", degree: "14°22′", retrograde: false, natalHouse: 12 },
    { name: "水星", sign: "巨蟹", degree: "18°05′", retrograde: false, natalHouse: 4 },
    { name: "金星", sign: "雙子", degree: "25°33′", retrograde: false, natalHouse: 3 },
    { name: "火星", sign: "處女", degree: "8°17′", retrograde: false, natalHouse: 6 },
    { name: "木星", sign: "巨蟹", degree: "3°41′", retrograde: false, natalHouse: 4 },
    { name: "土星", sign: "牡羊", degree: "12°55′", retrograde: true, natalHouse: 1 },
    { name: "天王星", sign: "金牛", degree: "27°08′", retrograde: false, natalHouse: 2 },
    { name: "海王星", sign: "牡羊", degree: "3°22′", retrograde: true, natalHouse: 1 },
    { name: "冥王星", sign: "水瓶", degree: "4°15′", retrograde: true, natalHouse: 11 },
  ],
  transitAspects: [
    {
      transitPlanet: "木星",
      type: "合相",
      natalPlanet: "金星",
      orb: "2°11′",
      strength: "強",
      applying: true,
      priority: "high",
      inPrimary: true,
    },
    {
      transitPlanet: "土星",
      type: "四分",
      natalPlanet: "月亮",
      orb: "4°13′",
      strength: "中",
      applying: false,
      priority: "high",
      inPrimary: true,
    },
    {
      transitPlanet: "天王星",
      type: "三分",
      natalPlanet: "太陽",
      orb: "5°54′",
      strength: "弱",
      applying: true,
      priority: "medium",
      inPrimary: true,
    },
  ],
  transitAspectsAppendix: [],
  transitChartJson: { schema_version: "1.0.0" },
  analysis: fallbackAnalysis,
};
