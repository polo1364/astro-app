export type DailyHoroscopeSectionKey =
  | "theme"
  | "work"
  | "love"
  | "money"
  | "health"
  | "advice"
  | "evidence";

export interface DailyHoroscopeSections {
  theme: string;
  work: string;
  love: string;
  money: string;
  health: string;
  advice: string;
  evidence: string;
}

export interface DailyHoroscopeEntry {
  signId: string;
  summary: string;
  sections: { title: string; body: string; key: DailyHoroscopeSectionKey }[];
}

export interface DailySkySummary {
  sun_sign: string;
  moon_sign: string;
  moon_events: { event: string; theme?: string }[];
  major_aspects_count?: number;
}

export type DailyBatchStatus = "ready" | "pending" | "failed";

export interface PublicDailyBatch {
  date: string;
  timezone: string;
  status: DailyBatchStatus;
  passed_sign_count: number;
  sky_summary: DailySkySummary | null;
  signs: Record<
    string,
    {
      sections: DailyHoroscopeSections;
      validation_status?: string;
    }
  >;
}

export const DAILY_SECTION_LABELS: Record<DailyHoroscopeSectionKey, string> = {
  theme: "今日主題",
  work: "工作運",
  love: "感情運",
  money: "金錢運",
  health: "健康提醒",
  advice: "今日建議",
  evidence: "盤面依據",
};

export const DAILY_SECTION_ORDER: DailyHoroscopeSectionKey[] = [
  "theme",
  "work",
  "love",
  "money",
  "health",
  "advice",
  "evidence",
];

export function batchEntryToHoroscope(
  signId: string,
  sections: DailyHoroscopeSections
): DailyHoroscopeEntry {
  return {
    signId,
    summary: sections.theme.slice(0, 24),
    sections: DAILY_SECTION_ORDER.map((key) => ({
      key,
      title: DAILY_SECTION_LABELS[key],
      body: sections[key],
    })),
  };
}
