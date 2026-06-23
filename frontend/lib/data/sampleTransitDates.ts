/** 範例行運日期池：涵蓋季節節點與常見查詢時段 */
export const sampleTransitDates: string[] = [
  "2026-06-22",
  "2026-03-20",
  "2026-06-21",
  "2026-09-23",
  "2026-12-21",
  "2026-01-29",
  "2026-02-14",
  "2026-04-12",
  "2026-07-07",
  "2026-10-15",
  "2026-11-08",
  "2026-05-01",
];

export function pickSampleTransitDate(): string {
  const idx = Math.floor(Math.random() * sampleTransitDates.length);
  return sampleTransitDates[idx];
}
