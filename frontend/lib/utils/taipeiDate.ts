const TPE = "Asia/Taipei";

/** YYYY-MM-DD in Asia/Taipei */
export function getTaipeiYMD(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TPE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function msUntilNextTaipeiMidnight(from: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TPE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(from);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const s = Number(parts.find((p) => p.type === "second")?.value ?? 0);
  const elapsedMs = (h * 3600 + m * 60 + s) * 1000;
  return Math.max(1000, 24 * 3600 * 1000 - elapsedMs + 500);
}

export function formatTaipeiDisplayDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00+08:00`);
  return d.toLocaleDateString("zh-TW", {
    timeZone: TPE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}
