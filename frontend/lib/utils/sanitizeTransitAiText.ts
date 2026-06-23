/**
 * Client-side mirror of backend transit_ai_sanitize (for cached sectionsAi).
 */

const SNAKE_KEY_ZH: Record<string, string> = {
  transit_validity: "盤面資料",
  transit_to_natal_aspects: "行運對本命相位",
  transit_planets: "行運行星",
  transit_planet: "行運星",
  transit_data: "行運資料",
  active_periods: "慢行星精準期",
  exact_dates: "精準日",
  natal_house: "本命宮",
  natal_point: "本命點",
  birth_data: "出生資料",
  can_analyze: "可分析項目",
  cannot_analyze: "不可分析項目",
  can_analyze_labels: "可分析項目",
  cannot_analyze_labels: "不可分析項目",
  can_calculate_natal_houses: "可計算本命宮位",
  has_birth_time: "有出生時間",
  has_transit_time: "有行運時間",
  timezone_id: "時區",
  schema_version: "",
  in_primary: "",
  aspect_zh: "相位",
  orb_str: "容許",
  sign_zh: "星座",
  name_zh: "行星",
};

const PLANET_EN_ZH: Record<string, string> = {
  sun: "太陽",
  moon: "月亮",
  mercury: "水星",
  venus: "金星",
  mars: "火星",
  jupiter: "木星",
  saturn: "土星",
  uranus: "天王星",
  neptune: "海王星",
  pluto: "冥王星",
};

const SIGN_EN_ZH: Record<string, string> = {
  aries: "牡羊",
  taurus: "金牛",
  gemini: "雙子",
  cancer: "巨蟹",
  leo: "獅子",
  virgo: "處女",
  libra: "天秤",
  scorpio: "天蠍",
  sagittarius: "射手",
  capricorn: "摩羯",
  aquarius: "水瓶",
  pisces: "雙魚",
};

const ASCII_WORD_ZH: Record<string, string> = {
  orb: "容許",
  applying: "入相",
  separating: "出相",
  priority: "優先級",
  strength: "強度",
  conjunction: "合相",
  square: "四分",
  sextile: "六分",
  trine: "三分",
  opposition: "對分",
  labels: "項目",
  true: "是",
  false: "否",
  mc: "中天",
  asc: "上升",
};

type Replacer = string | ((substring: string, ...args: string[]) => string);

const PREFIX_REPLACEMENTS: [RegExp, Replacer][] = [
  [/transit_to_natal_aspects\s*中[，,:：]\s*/gi, ""],
  [/transit_planets\s*中[，,:：]\s*/gi, ""],
  [/active_periods\s*中[，,:：]\s*/gi, ""],
  [/transit_validity\s*中的?\s*/gi, "盤面資料顯示"],
  [/exact_dates\s*為\s*/gi, "精準日為 "],
  [/exact_dates\s*[:：]\s*/gi, "精準日："],
  [/natal_house\s*為\s*/gi, "落本命宮 "],
  [/natal_house\s*[:：]\s*/gi, "落本命宮"],
  [/，\s*orb\s+/gi, "，容許 "],
  [/，\s*orb\s*[:：=]\s*/gi, "，容許 "],
  [/\borb\s*[:：=]\s*/gi, "容許 "],
  [/\borb\s+/gi, "容許 "],
  [
    /priority\s*[:：=]\s*(high|medium|low)/gi,
    (_m, p: string) => {
      const map: Record<string, string> = { high: "高", medium: "中", low: "低" };
      return `優先級${map[p.toLowerCase()] ?? p}`;
    },
  ],
];

const HOUSE_EVIDENCE =
  /(?:行運行星|transit_planets)\s*中\s*([^的]+?)\s*的\s*星座\s*為([^、，,。\n]+)、落本命宮\s*(\d+)/gi;

const ASPECT_EVIDENCE =
  /行運對本命相位\s*中\s*行運星\s*為([^、，,]+)、本命點\s*為([^、，,]+)、相位\s*為([^。.\n]+)/g;

function asciiToken(word: string): RegExp {
  return new RegExp(`(?<![A-Za-z_])${word}(?![A-Za-z_])`, "gi");
}

function planetNameZh(raw: string): string {
  const s = raw.trim();
  return PLANET_EN_ZH[s.toLowerCase()] ?? s;
}

function signWithZuo(raw: string): string {
  let s = raw.trim();
  const mapped = SIGN_EN_ZH[s.toLowerCase()];
  if (mapped) s = mapped;
  return s.endsWith("座") ? s : `${s}座`;
}

function rewriteEvidencePhrases(text: string): string {
  let out = text.replace(HOUSE_EVIDENCE, (_m, p: string, sign: string, h: string) => {
    return `行運${planetNameZh(p)}在${signWithZuo(sign)}，落本命第 ${h} 宮`;
  });
  out = out.replace(ASPECT_EVIDENCE, (_m, t: string, n: string, a: string) => {
    return `行運${planetNameZh(t)}${a.trim()}本命${planetNameZh(n)}`;
  });
  out = out.replace(/落本命宮\s*(\d+)/g, "落本命第 $1 宮");
  for (const [en, zh] of Object.entries(PLANET_EN_ZH)) {
    out = out.replace(asciiToken(en), zh);
  }
  for (const [en, zh] of Object.entries(SIGN_EN_ZH)) {
    out = out.replace(asciiToken(en), `${zh}座`);
  }
  out = out.replace(/行運星\s*為\s*/g, "");
  out = out.replace(/本命點\s*為\s*/g, "");
  out = out.replace(/相位\s*為\s*/g, "");
  out = out.replace(/星座\s*為\s*/g, "在");
  out = out.replace(/行運行星\s*中\s*/g, "");
  out = out.replace(/行運對本命相位\s*中\s*/g, "");
  return out;
}

const SNAKE_CATCHALL = /(?<![A-Za-z])[a-z][a-z0-9]*(?:_[a-z0-9]+)+(?![A-Za-z_])/gi;

export function sanitizeTransitAiText(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [re, repl] of PREFIX_REPLACEMENTS) {
    out =
      typeof repl === "function"
        ? out.replace(re, repl as (substring: string, ...args: string[]) => string)
        : out.replace(re, repl);
  }
  for (const [key, zh] of Object.entries(SNAKE_KEY_ZH)) {
    out = out.replace(asciiToken(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), zh);
  }
  for (const [word, zh] of Object.entries(ASCII_WORD_ZH)) {
    out = out.replace(asciiToken(word), zh);
  }
  out = rewriteEvidencePhrases(out);
  out = out.replace(SNAKE_CATCHALL, (m) => SNAKE_KEY_ZH[m.toLowerCase()] ?? "");
  out = out.replace(/[ \t]{2,}/g, " ");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/[，,]\s*[，,]/g, "，");
  return out.trim();
}
