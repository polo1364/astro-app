import { cn } from "@/lib/utils";
import type { ZodiacSign } from "@/lib/data/zodiacSigns";
import { signElementBorderColor } from "@/lib/utils/signElementColor";
import type { DailyHoroscopeEntry } from "@/lib/types/dailyHoroscope";
import { colors } from "@/lib/tokens/colors";

interface ZodiacWheelCenterProps {
  sign: ZodiacSign;
  horoscope: DailyHoroscopeEntry | null;
  loading?: boolean;
  className?: string;
}

export function ZodiacWheelCenter({
  sign,
  horoscope,
  loading = false,
  className,
}: ZodiacWheelCenterProps) {
  const borderColor = signElementBorderColor(sign.element);
  const glowColor = colors.element[sign.element];

  return (
    <div
      className={cn(
        "absolute inset-0 m-auto z-30 pointer-events-none flex items-center justify-center",
        className
      )}
      style={{ width: "42%", height: "42%" }}
    >
      <div
        className={cn(
          "w-full h-full rounded-full glass-strong flex flex-col items-center justify-center text-center px-3 py-2",
          loading && "animate-pulse",
          "pointer-events-none"
        )}
        style={{
          borderWidth: 2,
          borderStyle: "solid",
          borderColor,
          boxShadow: `inset 0 0 24px rgba(0,0,0,0.4), 0 0 20px ${glowColor}26`,
        }}
      >
        <span className="text-2xl mb-0.5" aria-hidden>
          {sign.symbol}
        </span>
        <p
          className="text-base font-semibold text-text-primary leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {sign.nameZh}
        </p>
        <p className="text-xs text-text-secondary mt-0.5 tabular-nums">{sign.dateRange}</p>
        {loading ? (
          <p className="text-sm text-text-secondary mt-2">載入今日運勢…</p>
        ) : (
          <p className="text-sm text-text-primary mt-2 line-clamp-3 leading-relaxed px-1">
            {horoscope?.summary ?? "點擊輪盤星座查看全文"}
          </p>
        )}
        <p className="text-xs text-text-muted mt-2">點擊輪盤星座查看全文</p>
      </div>
    </div>
  );
}
