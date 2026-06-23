import { ZODIAC_SIGNS } from "@/lib/data/zodiacSigns";

export interface DailyHoroscopeSection {
  title: string;
  body: string;
}

export interface DailyHoroscopeEntry {
  signId: string;
  summary: string;
  sections: DailyHoroscopeSection[];
}

const SUMMARY_TEMPLATES = [
  "今日能量活躍，適合主動出擊與開啟新計畫。",
  "穩健踏實的一天，財務與感官享受值得留意。",
  "溝通運佳，靈感迸發，適合學習與社交。",
  "情感細膩，家庭與內在安全感是今日主題。",
  "自信展現自我，創意與領導力受到矚目。",
  "注重細節與效率，健康與工作流程可優化。",
  "人際和諧，美感與平衡感帶來愉悅體驗。",
  "直覺敏銳，深度轉化與秘密議題浮現。",
  "冒險精神旺盛，遠方與哲思拓展視野。",
  "事業野心上升，結構化目標逐步推進。",
  "獨特見解引人注意，團體與理想值得投入。",
  "想像力豐富，藝術與靈性連結帶來療癒。",
];

function buildSections(nameZh: string): DailyHoroscopeSection[] {
  return [
    {
      title: "整體運勢",
      body: `${nameZh}今日整體運勢平穩偏上。星象顯示你能在日常節奏中找到平衡，適合按部就班完成既定事項，同時保留一點彈性應對突發狀況。`,
    },
    {
      title: "愛情運",
      body: `感情面適合坦誠交流。單身者可從興趣聚會中認識新朋友；有伴侶者不妨安排輕鬆約會，增進默契。`,
    },
    {
      title: "事業／學業",
      body: `工作與學習上宜聚焦核心任務，避免同時開太多戰線。午後效率較佳，可處理需要專注的細節。`,
    },
    {
      title: "財運",
      body: `理財以保守為宜，大額消費建議再觀望。小確幸消費能提升心情，但記得設定上限。`,
    },
    {
      title: "幸運提示",
      body: `幸運色：深藍；幸運數字：7。傍晚時分適合靜心整理思緒，為明日鋪路。`,
    },
  ];
}

export const MOCK_DAILY_HOROSCOPES: Record<string, DailyHoroscopeEntry> = Object.fromEntries(
  ZODIAC_SIGNS.map((sign, i) => [
    sign.id,
    {
      signId: sign.id,
      summary: SUMMARY_TEMPLATES[i],
      sections: buildSections(sign.nameZh),
    },
  ])
);

export const MOCK_PERSONAL_HOROSCOPE = {
  title: "個人今日運勢",
  sections: [
    {
      title: "今日主題",
      body: "行運月亮與本命太陽形成和諧相位，情緒與自我表達較為一致，適合展現真實想法。",
    },
    {
      title: "行運重點",
      body: "行運木星進入第十宮，事業與公眾形象有擴展機會；留意過度承諾，保持務實節奏。",
    },
    {
      title: "建議行動",
      body: "上午處理行政與溝通事項；下午適合創意發想或與導師／長輩請益。晚間宜早休息，補充能量。",
    },
  ],
};

export function getMockHoroscope(signId: string): DailyHoroscopeEntry {
  return MOCK_DAILY_HOROSCOPES[signId] ?? MOCK_DAILY_HOROSCOPES.aries;
}
