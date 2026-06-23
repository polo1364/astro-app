const SIGNS_ZH = [
  "牡羊", "金牛", "雙子", "巨蟹", "獅子", "處女",
  "天秤", "天蠍", "射手", "摩羯", "水瓶", "雙魚",
] as const;

/** Parse degree within sign from strings like `21°14′`. */
export function parseDegreeInSign(degree: string): number {
  const normalized = degree.replace(/′/g, "'").replace(/°/g, " ");
  const parts = normalized.trim().split(/\s+/);
  const d = parseFloat(parts[0] ?? "0") || 0;
  const mPart = parts[1]?.replace(/'/g, "") ?? "0";
  const m = parseFloat(mPart) || 0;
  return d + m / 60;
}

/** Absolute ecliptic longitude 0–360 from sign + degree string. */
export function longitudeFromSignDegree(sign: string, degree: string): number {
  const idx = SIGNS_ZH.indexOf(sign as (typeof SIGNS_ZH)[number]);
  if (idx < 0) return 0;
  return (idx * 30 + parseDegreeInSign(degree)) % 360;
}

/** Chart SVG angle (radians) with ASC at left; y-axis up for standard trig. */
export function eclipticToChartRad(lon: number, ascLon: number): number {
  const offset = ((lon - ascLon) % 360 + 360) % 360;
  return ((180 - offset) * Math.PI) / 180;
}

export function polarToXY(
  cx: number,
  cy: number,
  r: number,
  rad: number,
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}
