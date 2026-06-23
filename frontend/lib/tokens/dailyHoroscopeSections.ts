import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Briefcase,
  Coins,
  Heart,
  Lightbulb,
  Sparkles,
  Telescope,
} from "lucide-react";
import { colors } from "@/lib/tokens/colors";
import type { DailyHoroscopeSectionKey } from "@/lib/types/dailyHoroscope";

export interface DailySectionStyle {
  key: DailyHoroscopeSectionKey;
  title: string;
  color: string;
  icon: LucideIcon;
}

export const DAILY_SECTION_STYLES: DailySectionStyle[] = [
  { key: "theme", title: "今日主題", color: "var(--color-accent-daily)", icon: Sparkles },
  { key: "work", title: "工作運", color: colors.accent.transit, icon: Briefcase },
  { key: "love", title: "感情運", color: colors.planet.venus, icon: Heart },
  { key: "money", title: "金錢運", color: colors.element.earth, icon: Coins },
  { key: "health", title: "健康提醒", color: colors.status.ok, icon: Activity },
  { key: "advice", title: "今日建議", color: colors.accent.natal, icon: Lightbulb },
  { key: "evidence", title: "盤面依據", color: colors.report.evidence, icon: Telescope },
];

export const DAILY_SECTION_STYLE_MAP = Object.fromEntries(
  DAILY_SECTION_STYLES.map((s) => [s.key, s])
) as Record<DailyHoroscopeSectionKey, DailySectionStyle>;
