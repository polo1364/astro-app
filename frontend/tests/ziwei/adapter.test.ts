import assert from "node:assert/strict";
import test from "node:test";
import { defaultBirthData } from "../../lib/data/defaultBirthData";
import type { BirthFormData } from "../../lib/data/types";
import { calculateZiwei, prepareZiweiBirth } from "../../lib/ziwei/adapter";
import { generateChart } from "../../lib/ziwei/vendor/algorithm";
import { traditional } from "../../lib/ziwei/display";

function birth(overrides: Partial<BirthFormData> = {}): BirthFormData {
  return { ...defaultBirthData, ziwei: { gender: "female" }, ...overrides };
}

test("legacy saved profiles require a gender instead of silently assuming one", () => {
  const original = JSON.stringify(defaultBirthData);
  assert.throws(() => calculateZiwei(defaultBirthData), /排盤性別/);
  assert.equal(JSON.stringify(defaultBirthData), original);
});

test("unknown time never becomes an invented noon chart", () => {
  assert.throws(() => calculateZiwei(birth({ birthTimeUnknown: true })), /出生時間/);
  assert.throws(() => calculateZiwei(birth({ time: "" })), /出生時間/);
});

test("invalid dates, times and timezone are rejected", () => {
  for (const date of ["2025-02-29", "2024-02-30", "2024-04-31", "not-a-date"]) {
    assert.throws(() => prepareZiweiBirth(birth({ date })), /日期/);
  }
  assert.throws(() => prepareZiweiBirth(birth({ time: "24:00" })), /時間/);
  assert.throws(() => prepareZiweiBirth(birth({ timezone: "invalid" })), /時區/);
});

test("clock hours are converted to branch indexes at every boundary", () => {
  for (let hour = 0; hour < 24; hour++) {
    const input = prepareZiweiBirth(birth({ time: `${String(hour).padStart(2, "0")}:00` })).input;
    assert.equal(input.hour, Math.floor((hour + 1) / 2) % 12);
  }
});

test("late Zi advances only the engine date across year and leap-day boundaries", () => {
  for (const [date, expected] of [["2023-12-31", [2024, 1, 1]], ["2024-02-28", [2024, 2, 29]], ["2024-02-29", [2024, 3, 1]]] as const) {
    const data = birth({ date, time: "23:30" });
    const before = structuredClone(data);
    const { input, dayOffset } = prepareZiweiBirth(data);
    assert.deepEqual([input.year, input.month, input.day], expected);
    assert.equal(dayOffset, 1);
    assert.deepEqual(data, before);
    assert.equal(input.origInput?.clockHour, 23);
  }
  assert.equal(prepareZiweiBirth(birth({ time: "00:30" })).dayOffset, 0);
  assert.equal(prepareZiweiBirth(birth({ time: "23:30", ziwei: { gender: "male", lateZi: "current-day" } })).dayOffset, 0);
});

test("local civil time does not depend on the browser timezone or change Western data", () => {
  const taipei = birth({ timezone: "Asia/Taipei" });
  const utc = birth({ timezone: "UTC" });
  assert.deepEqual(prepareZiweiBirth(taipei).input, prepareZiweiBirth(utc).input);
  const before = structuredClone(taipei);
  calculateZiwei(taipei);
  assert.deepEqual(taipei, before);
});

test("both genders and each leap-month policy match the pinned upstream engine", () => {
  for (const gender of ["male", "female"] as const) {
    for (const leapMonth of ["split", "next-month", "prev-month", "origin-month"] as const) {
      const result = calculateZiwei(birth({ date: "2023-04-10", time: "08:30", ziwei: { gender, leapMonth } }));
      const direct = generateChart({ year: 2023, month: 4, day: 10, hour: 4, gender }, { leapMonth });
      assert.deepEqual(result.chart.palaces, direct.palaces);
      assert.equal(result.chart.palaces.length, 12);
      const stars = result.chart.palaces.flatMap(p => p.stars.filter(s => s.type === "major"));
      assert.equal(stars.length, 14);
      assert.equal(new Set(stars.map(s => s.name)).size, 14);
    }
  }
});

test("Traditional Chinese affects display only", () => {
  assert.equal(traditional("命宫 天机 太阴 贪狼 巨门 化禄"), "命宮 天機 太陰 貪狼 巨門 化祿");
});
