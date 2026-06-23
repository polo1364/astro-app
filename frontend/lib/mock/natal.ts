export interface Planet {
  name: string;
  sign: string;
  degree: string;
  house: number;
  retrograde: boolean;
  longitude?: number;
}

export interface Aspect {
  planetA: string;
  type: string;
  planetB: string;
  orb: string;
  strength: "強" | "中" | "弱";
}

export interface House {
  number: number;
  sign: string;
  degree: string;
  longitude?: number;
}

export interface ElementStat {
  element: string;
  count: number;
  percent: number;
}

export interface Pattern {
  name: string;
  planets: string[];
  description: string;
}

export interface AnalysisSection {
  title: string;
  lines: string[];
  text: string;
  evidence?: string[];
}

export interface NatalAnalysisReport {
  section1Validity: AnalysisSection;
  section2CoreSummary: AnalysisSection;
  sectionsAi?: string | null;
}

export interface NatalResult {
  meta: {
    name: string;
    birthDate: string;
    birthTime: string;
    timezone: string;
    latitude: string;
    longitude: string;
    houseSystem: string;
    utc: string;
    julianDay: string;
    engine: string;
    hasBirthTime?: boolean;
    location?: string;
  };
  planets: Planet[];
  aspects: Aspect[];
  houses: House[];
  elements: ElementStat[];
  patterns: Pattern[];
  stats: {
    dominantElement: string;
    dominantModality: string;
    chartShape: string;
    retrogradeCount: number;
  };
  chartJson: Record<string, unknown>;
  analysis: NatalAnalysisReport;
}

export { taiwanCities } from "@/lib/data/locations";

export const mockNatalResult: NatalResult = {
  meta: {
    name: "陳曉晴",
    birthDate: "1995-08-14",
    birthTime: "14:32",
    timezone: "Asia/Taipei (UTC+8)",
    latitude: "25.0330°N",
    longitude: "121.5654°E",
    houseSystem: "Placidus",
    utc: "1995-08-14 06:32:00 UTC",
    julianDay: "2450000.772",
    engine: "Swiss Ephemeris 2.10",
    hasBirthTime: true,
  },
  planets: [
    { name: "太陽", sign: "獅子", degree: "21°14′", house: 10, retrograde: false },
    { name: "月亮", sign: "天蠍", degree: "8°42′", house: 1, retrograde: false },
    { name: "水星", sign: "處女", degree: "3°55′", house: 9, retrograde: false },
    { name: "金星", sign: "巨蟹", degree: "27°08′", house: 8, retrograde: false },
    { name: "火星", sign: "天秤", degree: "15°31′", house: 11, retrograde: false },
    { name: "木星", sign: "射手", degree: "5°20′", house: 2, retrograde: false },
    { name: "土星", sign: "雙魚", degree: "22°47′", house: 5, retrograde: true },
    { name: "天王星", sign: "摩羯", degree: "28°11′", house: 3, retrograde: true },
    { name: "海王星", sign: "摩羯", degree: "24°03′", house: 3, retrograde: true },
    { name: "冥王星", sign: "天蠍", degree: "27°56′", house: 1, retrograde: false },
    { name: "上升", sign: "天蠍", degree: "12°05′", house: 1, retrograde: false },
    { name: "中天", sign: "獅子", degree: "18°33′", house: 10, retrograde: false },
  ],
  aspects: [
    { planetA: "太陽", type: "三分", planetB: "火星", orb: "5°43′", strength: "中" },
    { planetA: "月亮", type: "合相", planetB: "冥王星", orb: "0°46′", strength: "強" },
    { planetA: "金星", type: "對分", planetB: "土星", orb: "4°21′", strength: "中" },
    { planetA: "水星", type: "六分", planetB: "木星", orb: "1°25′", strength: "強" },
    { planetA: "火星", type: "四分", planetB: "冥王星", orb: "2°35′", strength: "中" },
    { planetA: "木星", type: "三分", planetB: "天王星", orb: "7°09′", strength: "弱" },
    { planetA: "土星", type: "合相", planetB: "海王星", orb: "1°16′", strength: "強" },
    { planetA: "太陽", type: "合相", planetB: "中天", orb: "2°41′", strength: "強" },
  ],
  houses: [
    { number: 1, sign: "天蠍", degree: "12°05′" },
    { number: 2, sign: "射手", degree: "10°22′" },
    { number: 3, sign: "摩羯", degree: "12°48′" },
    { number: 4, sign: "水瓶", degree: "18°33′" },
    { number: 5, sign: "雙魚", degree: "22°15′" },
    { number: 6, sign: "牡羊", degree: "20°08′" },
    { number: 7, sign: "金牛", degree: "12°05′" },
    { number: 8, sign: "雙子", degree: "10°22′" },
    { number: 9, sign: "巨蟹", degree: "12°48′" },
    { number: 10, sign: "獅子", degree: "18°33′" },
    { number: 11, sign: "處女", degree: "22°15′" },
    { number: 12, sign: "天秤", degree: "20°08′" },
  ],
  elements: [
    { element: "火", count: 3, percent: 25 },
    { element: "土", count: 4, percent: 33 },
    { element: "風", count: 2, percent: 17 },
    { element: "水", count: 3, percent: 25 },
  ],
  patterns: [
    {
      name: "T-Square",
      planets: ["金星", "土星", "火星"],
      description: "金星對分土星，火星四分兩者，形成壓力三角格局",
    },
    {
      name: "大三角（火象）",
      planets: ["太陽", "火星", "木星"],
      description: "火象大三角帶來行動力與自信的自然流動",
    },
  ],
  stats: {
    dominantElement: "土",
    dominantModality: "固定",
    chartShape: "碗型",
    retrogradeCount: 3,
  },
  chartJson: {},
  analysis: {
    section1Validity: {
      title: "一、資料完整性檢查",
      lines: [
        "- 出生日期：已提供（1995-08-14）",
        "- 出生時間：已提供（14:32）",
        "- 出生地點：已提供",
        "- 時區：已確認（Asia/Taipei）",
        "- 可以幫你分析的項目：太陽星座、月亮星座、行星相位、宮位等",
        "- 這次無法分析的項目：無",
      ],
      text: "## 一、資料完整性檢查\n- 出生日期：已提供（1995-08-14）\n- 出生時間：已提供（14:32）\n- 出生地點：已提供\n- 時區：已確認（Asia/Taipei）",
    },
    section2CoreSummary: {
      title: "二、命盤核心摘要",
      lines: [
        "- 太陽：你的核心自我認同帶有獅子座的表現欲與領導感（太陽在獅子座，與事業相關的第 10 宮有關）",
        "- 月亮：情緒深刻、直覺敏銳（月亮在天蠍座）",
        "- 上升：外在風格帶有天蠍座的深沉特質",
      ],
      evidence: ["太陽在獅子座", "月亮在天蠍座", "上升在天蠍座"],
      text: "## 二、命盤核心摘要\n- 太陽：核心自我認同帶有獅子座特質\n- 月亮：情緒深刻（天蠍座）\n- 上升：外在風格深沉（天蠍座）",
    },
    sectionsAi: null,
  },
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
