import type { DailyHoroscopeSectionKey } from "@/lib/types/dailyHoroscope";

export type PersonalDailySectionKey = DailyHoroscopeSectionKey;

export interface PersonalDailySections {
  theme: string;
  work: string;
  love: string;
  money: string;
  health: string;
  advice: string;
  evidence: string;
}

export interface PersonalDailyDataValidity {
  canUseHouses: boolean;
  canUseAngles: boolean;
  canUseMoonPrecision: boolean;
  moonUncertain?: boolean;
  hasBirthTime?: boolean;
}

export interface PersonalDailyResponse {
  profileId: string;
  date: string;
  status: string;
  dataValidity: PersonalDailyDataValidity;
  sections: PersonalDailySections;
  validationStatus: string;
  cached?: boolean;
  modelName?: string;
}

export const PERSONAL_DAILY_SECTION_LABELS: Record<PersonalDailySectionKey, string> = {
  theme: "今日主題：",
  work: "工作與日常：",
  love: "感情與人際：",
  money: "金錢與決策：",
  health: "身心狀態：",
  advice: "今日提醒：",
  evidence: "盤面依據：",
};

export const PERSONAL_DAILY_SECTION_ORDER: PersonalDailySectionKey[] = [
  "theme",
  "work",
  "love",
  "money",
  "health",
  "advice",
  "evidence",
];
