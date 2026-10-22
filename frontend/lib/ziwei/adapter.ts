import type { BirthFormData } from "../data/types";
import { generateChart, setBrightnessSchool, type LunarMonthPolicy } from "./vendor/algorithm";
import {
  calculateTrueSolarTime,
  isValidGregorianDate,
  resolveZiweiDayOffset,
  shiftGregorianDate,
} from "./vendor/true-solar-time";
import type { BirthInfo } from "./vendor/types";

export const ZIWEI_SOURCE = "https://github.com/Renhuai123/ziwei-doushu";
export const ZIWEI_REVISION = "1059c347231c636bd86ddb78fd8ed430d5de8d2a";
export const LEAP_MONTH_LABELS: Record<LunarMonthPolicy, string> = {
  split: "分半：前十五日歸本月，之後歸下月",
  "next-month": "整個閏月歸下月",
  "prev-month": "整個閏月歸本月",
  "origin-month": "保留原閏月",
};

/** The engine receives local civil time, not a UTC-shifted date or the Western chart's Julian day. */
export function prepareZiweiBirth(data: BirthFormData) {
  if (data.birthTimeUnknown || !data.time) throw new Error("紫微斗數需要出生時辰，請先補上出生時間。");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error("請填寫有效的公曆出生日期。");
  const [year, month, day] = data.date.split("-").map(Number);
  if (!isValidGregorianDate(year, month, day)) throw new Error("出生日期不存在，請檢查年月日。");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) throw new Error("請填寫有效的出生時間（00:00–23:59）。");
  if (!data.timezone.trim()) throw new Error("請選擇出生地時區。");
  try {
    new Intl.DateTimeFormat("en", { timeZone: data.timezone });
  } catch {
    throw new Error("出生地時區無效，請重新選擇。");
  }
  const gender = data.ziwei?.gender;
  if (gender !== "male" && gender !== "female") throw new Error("請選擇紫微排盤性別；此設定不影響西洋占星。");
  const lateZi = data.ziwei?.lateZi ?? "next-day";
  const leapMonth = data.ziwei?.leapMonth ?? "split";
  if (lateZi !== "next-day" && lateZi !== "current-day") throw new Error("晚子時設定無效，請重新選擇。");
  if (!Object.hasOwn(LEAP_MONTH_LABELS, leapMonth)) throw new Error("閏月設定無效，請重新選擇。");
  const [clockHour, clockMinute] = data.time.split(":").map(Number);
  // No longitude supplied: use the upstream clock/branch and day-boundary helpers
  // without silently applying its UTC+8-specific true-solar correction.
  const clock = calculateTrueSolarTime({ year, month, day, clockHour, clockMinute });
  const dayOffset = resolveZiweiDayOffset(clock, lateZi);
  const chartDay = shiftGregorianDate({ year, month, day }, dayOffset);
  const input: BirthInfo = {
    ...chartDay,
    hour: clock.branch,
    gender,
    name: data.name,
    city: data.city,
    origInput: { year, month, day, clockHour, clockMinute },
  };
  return { input, leapMonth, lateZi, dayOffset };
}

export function calculateZiwei(data: BirthFormData) {
  const prepared = prepareZiweiBirth(data);
  // Explicitly reset the upstream module-level brightness choice for each chart.
  setBrightnessSchool("default");
  const chart = generateChart(prepared.input, { leapMonth: prepared.leapMonth });
  return { ...prepared, chart, source: JSON.stringify(data), original: structuredClone(data) };
}

export type ZiweiResult = ReturnType<typeof calculateZiwei>;
