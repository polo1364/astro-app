import type { DailySkySummary } from "@/lib/types/dailyHoroscope";
import { planetColorByName, signElementColor } from "@/lib/tokens/colors";
import { cn } from "@/lib/utils";

const SIGN_EN_MAP: Record<string, string> = {
  Aries: "牡羊",
  Taurus: "金牛",
  Gemini: "雙子",
  Cancer: "巨蟹",
  Leo: "獅子",
  Virgo: "處女",
  Libra: "天秤",
  Scorpio: "天蠍",
  Sagittarius: "射手",
  Capricorn: "摩羯",
  Aquarius: "水瓶",
  Pisces: "雙魚",
};

interface DailySkyStripProps {
  summary: DailySkySummary | null;
  className?: string;
}

export function DailySkyStrip({ summary, className }: DailySkyStripProps) {
  if (!summary) return null;

  const sunZh = SIGN_EN_MAP[summary.sun_sign] ?? summary.sun_sign;
  const moonZh = SIGN_EN_MAP[summary.moon_sign] ?? summary.moon_sign;
  const hasMoonEvent = summary.moon_events.length > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm",
        className
      )}
    >
      <span>
        <span style={{ color: planetColorByName["太陽"] }}>☉</span>{" "}
        <span className="text-text-secondary">太陽</span>{" "}
        <span className="font-medium" style={{ color: signElementColor[sunZh] }}>{sunZh}</span>
      </span>
      <span className="text-text-muted">·</span>
      <span>
        <span style={{ color: planetColorByName["月亮"] }}>☽</span>{" "}
        <span className="text-text-secondary">月亮</span>{" "}
        <span className="font-medium" style={{ color: signElementColor[moonZh] }}>{moonZh}</span>
      </span>
      {hasMoonEvent && (
        <span className="text-xs px-2 py-0.5 rounded-full border border-border-strong text-text-secondary">
          換座
        </span>
      )}
    </div>
  );
}
