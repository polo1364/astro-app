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
      style={{ width: "44%", height: "44%" }}
    >
      <div
        className={cn(
          "w-full h-full rounded-full glass-strong flex flex-col items-center justify-center text-center px-2 py-1.5 sm:px-3 sm:py-2",
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
        <span className="text-xl sm:text-2xl mb-0.5 leading-none" aria-hidden>
          {sign.symbol}
        </span>
        <p
          className="text-sm sm:text-base font-semibold text-text-primary leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {sign.nameZh}
        </p>
        <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5 tabular-nums leading-tight">
          {sign.dateRange}
        </p>
        {loading ? (
          <p className="text-[11px] sm:text-sm text-text-secondary mt-1.5 sm:mt-2 leading-snug">
            載入今日運勢…
          </p>
        ) : horoscope ? (
          <p className="text-[11px] sm:text-sm text-text-primary mt-1.5 sm:mt-2 line-clamp-2 sm:line-clamp-3 leading-snug px-0.5">
            {horoscope.summary}
          </p>
        ) : (
          <p className="text-[11px] sm:text-sm text-text-muted mt-1.5 sm:mt-2 leading-snug px-0.5">
            點擊輪盤星座查看全文
          </p>
        )}
      </div>
    </div>
  );
}
