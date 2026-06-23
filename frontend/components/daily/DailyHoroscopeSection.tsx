import { cn } from "@/lib/utils";
import type { DailyHoroscopeSectionKey } from "@/lib/types/dailyHoroscope";
import { DAILY_SECTION_STYLE_MAP } from "@/lib/tokens/dailyHoroscopeSections";
import { PERSONAL_DAILY_SECTION_STYLE_MAP } from "@/lib/tokens/personalDailyHoroscopeSections";
import { highlightReport } from "@/lib/utils/highlightReport";

interface DailyHoroscopeSectionProps {
  sectionKey: DailyHoroscopeSectionKey;
  body: string;
  className?: string;
  compact?: boolean;
  variant?: "public" | "personal";
}

export function DailyHoroscopeSection({
  sectionKey,
  body,
  className,
  compact = false,
  variant = "public",
}: DailyHoroscopeSectionProps) {
  const style =
    variant === "personal"
      ? PERSONAL_DAILY_SECTION_STYLE_MAP[sectionKey]
      : DAILY_SECTION_STYLE_MAP[sectionKey];
  const Icon = style.icon;
  const isEvidence = sectionKey === "evidence";

  return (
    <section
      className={cn(
        "rounded-md border border-border/60 border-l-4 pl-0 overflow-hidden",
        className
      )}
      style={{ borderLeftColor: style.color }}
    >
      <div
        className="px-3 py-2"
        style={{ backgroundColor: `${style.color}0d` }}
      >
        <h3
          className={cn(
            "font-semibold flex items-center gap-1.5",
            compact || isEvidence ? "text-caption" : "text-sm"
          )}
          style={{ color: style.color }}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          {style.title}
        </h3>
        <p
          className={cn(
            "text-text-secondary leading-relaxed mt-1.5",
            compact || isEvidence ? "text-caption" : "text-body"
          )}
        >
          {highlightReport(body, variant === "personal")}
        </p>
      </div>
    </section>
  );
}
