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
import type { PersonalDailySectionKey } from "@/lib/types/personalDailyHoroscope";

export interface PersonalDailySectionStyle {
  key: PersonalDailySectionKey;
  title: string;
  color: string;
  icon: LucideIcon;
}

export const PERSONAL_DAILY_SECTION_STYLES: PersonalDailySectionStyle[] = [
  { key: "theme", title: "今日主題：", color: colors.accent.natal, icon: Sparkles },
  { key: "work", title: "工作與日常：", color: colors.accent.transit, icon: Briefcase },
  { key: "love", title: "感情與人際：", color: colors.planet.venus, icon: Heart },
  { key: "money", title: "金錢與決策：", color: colors.element.earth, icon: Coins },
  { key: "health", title: "身心狀態：", color: colors.status.ok, icon: Activity },
  { key: "advice", title: "今日提醒：", color: colors.text.gold, icon: Lightbulb },
  { key: "evidence", title: "盤面依據：", color: colors.report.evidence, icon: Telescope },
];

export const PERSONAL_DAILY_SECTION_STYLE_MAP = Object.fromEntries(
  PERSONAL_DAILY_SECTION_STYLES.map((s) => [s.key, s]),
) as Record<PersonalDailySectionKey, PersonalDailySectionStyle>;
