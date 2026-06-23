export const colors = {
  bg: {
    base: "#05040b",
    glass: "rgba(5, 4, 11, 0.65)",
    stage: "rgba(5, 4, 11, 0.82)",
  },
  text: {
    primary: "#f5f3ff",
    secondary: "#c4bdd8",
    muted: "#8b8499",
    gold: "#e8d5a3",
  },
  accent: {
    natal: "#c4b5fd",
    transit: "#fbbf24",
    border: "rgba(232, 213, 163, 0.18)",
    borderStrong: "rgba(232, 213, 163, 0.35)",
  },
  report: {
    rule: "#e8d5a3",
    ai: "#a5f3fc",
    evidence: "#c4b5fd",
  },
  status: {
    ok: "#86efac",
    warn: "#fcd34d",
    blocked: "#fca5a5",
  },
  typography: {
    body: "0.9375rem",
    bodyLg: "1.0625rem",
    caption: "0.8125rem",
    label: "0.75rem",
  },
  planet: {
    sun: "#fbbf24",
    moon: "#c4b5fd",
    mercury: "#94a3b8",
    venus: "#f472b6",
    mars: "#ef4444",
    jupiter: "#fb923c",
    saturn: "#a78bfa",
    uranus: "#22d3ee",
    neptune: "#60a5fa",
    pluto: "#9ca3af",
  },
  element: {
    fire: "#ef4444",
    earth: "#84cc16",
    air: "#38bdf8",
    water: "#818cf8",
  },
  aspect: {
    conjunction: "#fbbf24",
    opposition: "#ef4444",
    trine: "#22c55e",
    square: "#f97316",
    sextile: "#38bdf8",
  },
} as const;

/** 行星中文名 → 顏色 */
export const planetColorByName: Record<string, string> = {
  太陽: colors.planet.sun,
  月亮: colors.planet.moon,
  水星: colors.planet.mercury,
  金星: colors.planet.venus,
  火星: colors.planet.mars,
  木星: colors.planet.jupiter,
  土星: colors.planet.saturn,
  天王星: colors.planet.uranus,
  海王星: colors.planet.neptune,
  冥王星: colors.planet.pluto,
  上升: colors.accent.natal,
  中天: colors.text.gold,
};

/** 星座 → 元素色（簡稱） */
export const signElementColor: Record<string, string> = {
  牡羊: colors.element.fire,
  獅子: colors.element.fire,
  射手: colors.element.fire,
  金牛: colors.element.earth,
  處女: colors.element.earth,
  摩羯: colors.element.earth,
  雙子: colors.element.air,
  天秤: colors.element.air,
  水瓶: colors.element.air,
  巨蟹: colors.element.water,
  天蠍: colors.element.water,
  雙魚: colors.element.water,
};

/** 星座全名 → 元素色（盤面依據等段落用） */
export const signColorByName: Record<string, string> = {
  ...signElementColor,
  牡羊座: signElementColor.牡羊,
  金牛座: signElementColor.金牛,
  雙子座: signElementColor.雙子,
  巨蟹座: signElementColor.巨蟹,
  獅子座: signElementColor.獅子,
  處女座: signElementColor.處女,
  天秤座: signElementColor.天秤,
  天蠍座: signElementColor.天蠍,
  射手座: signElementColor.射手,
  摩羯座: signElementColor.摩羯,
  水瓶座: signElementColor.水瓶,
  雙魚座: signElementColor.雙魚,
};

/** 相位中文名 → 顏色 */
export const aspectColorByName: Record<string, string> = {
  合相: colors.aspect.conjunction,
  六分: colors.aspect.sextile,
  四分: colors.aspect.square,
  刑: colors.aspect.square,
  三分: colors.aspect.trine,
  對分: colors.aspect.opposition,
};

export const zodiacSigns = [
  "牡羊",
  "金牛",
  "雙子",
  "巨蟹",
  "獅子",
  "處女",
  "天秤",
  "天蠍",
  "射手",
  "摩羯",
  "水瓶",
  "雙魚",
] as const;

export const planetGlyphs: Record<string, string> = {
  太陽: "☉",
  月亮: "☽",
  水星: "☿",
  金星: "♀",
  火星: "♂",
  木星: "♃",
  土星: "♄",
  天王星: "♅",
  海王星: "♆",
  冥王星: "♇",
  上升: "Asc",
  中天: "MC",
};
