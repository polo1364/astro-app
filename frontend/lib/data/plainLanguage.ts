/** 畫面上固定顯示的超白話（短句、少括號） */

export const PLAIN_NICK: Record<string, string> = {
  太陽: "志向",
  月亮: "情緒",
  水星: "想法",
  金星: "感情",
  火星: "行動",
  木星: "好運",
  土星: "壓力",
  天王星: "變化",
  海王星: "夢想",
  冥王星: "執著",
  上升: "第一印象",
  中天: "事業形象",
};

export const PLAIN_SIGNS: Record<string, string> = {
  牡羊: "直來直往",
  金牛: "穩扎穩打",
  雙子: "愛聊愛學",
  巨蟹: "重感情",
  獅子: "愛表現",
  處女: "愛細節",
  天秤: "重關係",
  天蠍: "很深情",
  射手: "愛自由",
  摩羯: "能扛事",
  水瓶: "想法獨特",
  雙魚: "愛想像",
};

export const PLAIN_HOUSE_TOPIC: Record<number, string> = {
  1: "外表與自我",
  2: "錢與價值",
  3: "溝通學習",
  4: "家庭根基",
  5: "戀愛玩樂",
  6: "工作健康",
  7: "伴侶合作",
  8: "親密共有",
  9: "遠行信念",
  10: "事業名聲",
  11: "朋友願景",
  12: "私下休息",
};

const ASPECT_VERB: Record<string, string> = {
  合相: "黏很緊",
  六分: "好配合",
  四分: "易卡住",
  三分: "很順",
  對分: "互相拉",
};

const ASPECT_TAIL: Record<string, string> = {
  合相: "常一起發生",
  六分: "多半是機會",
  四分: "有摩擦也推你動",
  三分: "做起來省力",
  對分: "要在兩頭找平衡",
};

const STRENGTH_TAG: Record<string, string> = {
  強: "影響大",
  中: "影響中等",
  弱: "影響小",
};

/** 行星列：一行、用 · 分隔 */
export function plainPlanetLine(
  name: string,
  sign: string,
  house: number,
  retrograde: boolean,
  hideHouse: boolean,
): string {
  const bits: string[] = [];
  if (PLAIN_SIGNS[sign]) bits.push(`${sign}座${PLAIN_SIGNS[sign]}`);
  if (!hideHouse && house > 0 && PLAIN_HOUSE_TOPIC[house]) {
    bits.push(`常跟${PLAIN_HOUSE_TOPIC[house]}有關`);
  }
  if (retrograde) bits.push("R＝先慢下來再說");
  return bits.join(" · ");
}

export const PLAIN_ELEMENTS: Record<string, string> = {
  火: "熱情、行動力",
  土: "務實、能扛事",
  風: "想法、溝通",
  水: "感情、直覺",
};

export const PLAIN_MODALITY: Record<string, string> = {
  開創: "愛開局、先動再說",
  固定: "穩、不易被帶跑",
  變動: "彈性高、好適應",
};

export const PLAIN_CHART_SHAPE: Record<string, string> = {
  集中型: "能量集中在一塊人生領域",
  單邊型: "行星偏在一側",
  拉鍊型: "有明顯空檔與密集區",
  散開型: "能量分散各處",
  標準: "分布較平均",
  碗型: "行星聚在一半圓內",
  未知: "需完整出生時間才判斷",
};

export const PLAIN_PATTERN_NAMES: Record<string, string> = {
  "T-Square": "壓力三角",
  T三角: "壓力三角",
  大三角: "順流三角",
  "大三角（火象）": "順流三角",
  對分軸: "拉扯軸線",
  星群: "能量星群",
};

export function plainElementLine(element: string, percent: number): string {
  const trait = PLAIN_ELEMENTS[element] ?? element;
  return `${element}元素 ${percent}%：${trait}`;
}

export function plainStatsHint(
  field: "element" | "modality" | "shape" | "retrograde",
  value: string | number,
): string {
  switch (field) {
    case "element":
      return `整體偏${value}：${PLAIN_ELEMENTS[String(value)] ?? ""}`;
    case "modality":
      return PLAIN_MODALITY[String(value)] ?? String(value);
    case "shape":
      return PLAIN_CHART_SHAPE[String(value)] ?? String(value);
    case "retrograde":
      return Number(value) > 0
        ? `${value} 顆逆行：有些事宜慢、宜回顧再出手`
        : "沒有逆行行星，節奏相對直線";
    default:
      return "";
  }
}

export function plainPatternLine(name: string, planets: string[]): string {
  const zh = PLAIN_PATTERN_NAMES[name] ?? name;
  const nicks = planets.map((p) => PLAIN_NICK[p] ?? p).join("、");
  return `${zh}：${nicks} 之間能量牽連較緊`;
}

/** 宮位列：一行 */
export function plainHouseLine(number: number, sign: string): string {
  const topic = PLAIN_HOUSE_TOPIC[number] ?? "人生某一塊";
  const style = PLAIN_SIGNS[sign] ? `${sign}座${PLAIN_SIGNS[sign]}` : `${sign}座`;
  return `在講${topic} · ${style}`;
}

/** 相位列：一句話，不重複括號定義 */
export function plainAspectLine(
  planetA: string,
  planetB: string,
  type: string,
  strength: string,
): string {
  const a = PLAIN_NICK[planetA] ?? planetA;
  const b = PLAIN_NICK[planetB] ?? planetB;
  const verb = ASPECT_VERB[type] ?? type;
  const tail = ASPECT_TAIL[type] ?? "";
  const tag = STRENGTH_TAG[strength] ?? "";
  return `${a}與${b}${verb}，${tail}（${tag}）`;
}

const APPLYING_PLAIN = { true: "還在加強", false: "高峰可能已過" } as const;

/** 行運相位列白話 */
export function plainTransitAspectLine(
  transitPlanet: string,
  natalPoint: string,
  type: string,
  strength: string,
  applying?: boolean,
  natalHouse?: number | null,
): string {
  const t = PLAIN_NICK[transitPlanet] ?? transitPlanet;
  const n = PLAIN_NICK[natalPoint] ?? natalPoint;
  const verb = ASPECT_VERB[type] ?? type;
  const tag = STRENGTH_TAG[strength] ?? "";
  const app =
    applying === undefined ? "" : ` · ${APPLYING_PLAIN[String(applying) as "true" | "false"]}`;
  const house =
    natalHouse && PLAIN_HOUSE_TOPIC[natalHouse]
      ? ` · 行運星落在你${PLAIN_HOUSE_TOPIC[natalHouse]}這塊`
      : "";
  return `現在的${t}對你的${n}${verb}（${tag}）${app}${house}`;
}

/** 行運行星列白話 */
export function plainTransitPlanetLine(
  name: string,
  sign: string,
  retrograde: boolean,
  natalHouse?: number | null,
  hideHouse?: boolean,
): string {
  const bits: string[] = [];
  if (PLAIN_SIGNS[sign]) bits.push(`${sign}座${PLAIN_SIGNS[sign]}`);
  if (!hideHouse && natalHouse && PLAIN_HOUSE_TOPIC[natalHouse]) {
    bits.push(`落在你${PLAIN_HOUSE_TOPIC[natalHouse]}這區`);
  }
  if (retrograde) bits.push("R＝先慢下來再說");
  return bits.join(" · ");
}

/** 側欄重點行運一句話 */
export function plainTransitHighlight(
  transitPlanet: string,
  type: string,
  natalPoint: string,
  applying: boolean,
): string {
  const t = PLAIN_NICK[transitPlanet] ?? transitPlanet;
  const n = PLAIN_NICK[natalPoint] ?? natalPoint;
  const verb = ASPECT_VERB[type] ?? type;
  return `${t}正在${verb}你的${n}，${APPLYING_PLAIN[String(applying) as "true" | "false"]}`;
}

/** 星盤圖例用 */
export const PLAIN_PLANETS: Record<string, string> = {
  太陽: "你是誰、人生往哪走",
  月亮: "情緒與安全感",
  水星: "怎麼想、怎麼說",
  金星: "喜歡什麼、怎麼談感情",
  火星: "怎麼行動、怎麼發火",
  木星: "好運與成長",
  土星: "壓力與責任",
  天王星: "突然改變",
  海王星: "夢想與直覺",
  冥王星: "執著與翻新",
  上升: "別人第一眼印象",
  中天: "事業與名聲",
};
