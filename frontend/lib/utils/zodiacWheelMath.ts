export const WHEEL_SPIN_DURATION_MS = 96_000;
export const ZODIAC_SECTOR_DEGREES = 30;
const HALF = ZODIAC_SECTOR_DEGREES / 2;

export const WHEEL_INNER_RADIUS = 21 / 50;
export const WHEEL_OUTER_RADIUS = 1;

/** 圖上星座格與「12 點 = 牡羊中心」假設相差一格，需整體位移修正 */
const SIGN_SECTOR_OFFSET_DEG = ZODIAC_SECTOR_DEGREES;

/**
 * 中央指針用：以「最接近的星座中心」判定（牡羊中心在 12 點）。
 * 星座中心轉到指針正下方時才換，不會在交界提早跳格。
 */
export function signIndexNearestCenter(wheelAngleDeg: number): number {
  const w = ((wheelAngleDeg % 360) + 360) % 360;
  const signed = w > 180 ? w - 360 : w;
  const raw = Math.floor((signed + HALF) / ZODIAC_SECTOR_DEGREES);
  return ((raw % 12) + 12) % 12;
}

/**
 * Hover／點擊用：以輪盤實際格線判定（每格 [k*30, (k+1)*30)）。
 * 與圖上的 12 等分扇形對齊，高亮不會卡在兩星座中間。
 */
export function signIndexInSector(wheelAngleDeg: number): number {
  const w = ((wheelAngleDeg % 360) + 360) % 360;
  return Math.floor(w / ZODIAC_SECTOR_DEGREES) % 12;
}

/** 固定 12 點指針（中央用，最接近中心） */
export function signIndexAtPointer(rotationDeg: number): number {
  const wheel = ((0 - rotationDeg + SIGN_SECTOR_OFFSET_DEG) % 360 + 360) % 360;
  return signIndexNearestCenter(wheel);
}

/** 滑鼠點（螢幕座標，相對輪盤圓心）→ 星座 index（格線判定） */
export function signIndexFromPoint(
  dx: number,
  dy: number,
  diameter: number,
  rotationDeg: number
): number | null {
  const radius = diameter / 2;
  const nx = dx / radius;
  const ny = dy / radius;
  const dist = Math.hypot(nx, ny);
  if (dist < WHEEL_INNER_RADIUS || dist > WHEEL_OUTER_RADIUS) return null;

  let screenAngle = (Math.atan2(nx, -ny) * 180) / Math.PI;
  if (screenAngle < 0) screenAngle += 360;
  const wheel = ((screenAngle - rotationDeg + SIGN_SECTOR_OFFSET_DEG) % 360 + 360) % 360;
  return signIndexInSector(wheel);
}

/** 高亮扇形：與格線判定一致，[k*30, (k+1)*30) */
export function sectorBounds(index: number): { startDeg: number; endDeg: number } {
  return {
    startDeg: index * ZODIAC_SECTOR_DEGREES,
    endDeg: (index + 1) * ZODIAC_SECTOR_DEGREES,
  };
}

/** 依星座 index 取得其在輪盤上實際對應的高亮扇形（含位移修正） */
export function highlightSectorBounds(signIndex: number): {
  startDeg: number;
  endDeg: number;
} {
  const offsetSectors = SIGN_SECTOR_OFFSET_DEG / ZODIAC_SECTOR_DEGREES;
  const geometric = ((signIndex - offsetSectors) % 12 + 12) % 12;
  return sectorBounds(geometric);
}

/** 把輪盤旋轉到指定星座中心對準指針 */
export function rotationForSignIndex(index: number): number {
  return ((360 - index * ZODIAC_SECTOR_DEGREES) % 360 + 360) % 360;
}
