"use client";

import type { ZiweiResult } from "@/lib/ziwei/adapter";
import type { Palace, Star } from "@/lib/ziwei/vendor/types";
import { BRANCH_LABELS, STEM_LABELS, traditional as t } from "@/lib/ziwei/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const BOARD = [
  { branch: 5, row: 1, column: 1 }, { branch: 6, row: 1, column: 2 },
  { branch: 7, row: 1, column: 3 }, { branch: 8, row: 1, column: 4 },
  { branch: 4, row: 2, column: 1 }, { branch: 9, row: 2, column: 4 },
  { branch: 3, row: 3, column: 1 }, { branch: 10, row: 3, column: 4 },
  { branch: 2, row: 4, column: 1 }, { branch: 1, row: 4, column: 2 },
  { branch: 0, row: 4, column: 3 }, { branch: 11, row: 4, column: 4 },
];

function StarLabel({ star }: { star: Star }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span>{t(star.name)}</span>
      {star.brightnessRaw && <span className="text-[11px] text-text-muted">{t(star.brightnessRaw)}</span>}
      {star.siHua && <span className="rounded border border-accent-natal/30 bg-accent-natal/10 px-1 text-[11px] text-accent-natal">化{t(star.siHua)}</span>}
    </span>
  );
}

function PalaceButton({ palace, selected, onSelect }: { palace: Palace; selected: boolean; onSelect: () => void }) {
  const majors = palace.stars.filter(s => s.type === "major");
  return (
    <button
      type="button" onClick={onSelect} aria-pressed={selected}
      aria-label={`查看${t(palace.name)}（${BRANCH_LABELS[palace.branch]}）`}
      className={cn(
        "h-full w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent-natal",
        selected ? "border-accent-natal/60 bg-accent-natal/10" : "border-border bg-white/[0.02] hover:bg-white/5",
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-1">
        <span className="font-semibold text-sm text-text-primary">{t(palace.name)}</span>
        <span className="text-xs text-text-muted">{STEM_LABELS[palace.stem]}{BRANCH_LABELS[palace.branch]}</span>
      </span>
      <span className="mt-2 flex flex-col gap-1 text-sm text-accent-natal">
        {majors.length ? majors.map(star => <StarLabel key={star.name} star={star} />) : <span className="text-text-muted">無主星</span>}
      </span>
      <span className="mt-2 flex flex-wrap gap-1 text-xs text-text-secondary">
        {palace.isShenGong && <span className="rounded bg-white/10 px-1">身宮</span>}
        {palace.stars.filter(s => s.type !== "major" && s.siHua).map(star => <StarLabel key={star.name} star={star} />)}
      </span>
      {palace.daXianAge && <span className="mt-2 block text-[11px] text-text-muted">大限 {palace.daXianAge.join("–")} 歲</span>}
    </button>
  );
}

export function ZiweiChart({ result, selectedBranch, onSelect }: {
  result: ZiweiResult; selectedBranch: number; onSelect: (branch: number) => void;
}) {
  const { chart, original } = result;
  const selected = chart.palaces.find(p => p.branch === selectedBranch) ?? chart.palaces[0];
  const lunar = chart.lunarInfo;
  return (
    <div className="space-y-4" aria-label="紫微命盤結果">
      <Card>
        <CardHeader>
          <CardTitle>{original.name || "未命名"}的紫微命盤</CardTitle>
          <p className="mt-1 text-xs text-text-secondary">公曆 {original.date} {original.time} · {original.timezone}{original.city ? ` · ${original.city}` : ""}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
            <span>農曆 {lunar.lunarYear} 年 {lunar.isLeapMonth ? "閏" : ""}{lunar.lunarMonth} 月 {lunar.lunarDay} 日</span>
            <span>{BRANCH_LABELS[chart.birthInfo.hour]}時 · {t(chart.yinYangGender ?? "")}</span>
            <span className="text-accent-natal">{t(chart.wuxingJuName)}</span>
          </div>
          <p className="text-xs text-text-muted">點選宮位查看完整星曜。亮度依《斗數全書》，四化顯示本命生年四化。</p>
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            {chart.palaces.map(palace => <div key={palace.branch} className="min-h-40"><PalaceButton palace={palace} selected={selectedBranch === palace.branch} onSelect={() => onSelect(palace.branch)} /></div>)}
          </div>
          <div className="hidden grid-cols-4 gap-2 sm:grid">
            {BOARD.map(({ branch, row, column }) => {
              const palace = chart.palaces.find(p => p.branch === branch);
              return palace && <div key={branch} style={{ gridRow: row, gridColumn: column }} className="min-h-40 min-w-0"><PalaceButton palace={palace} selected={selectedBranch === branch} onSelect={() => onSelect(branch)} /></div>;
            })}
            <div className="col-start-2 col-span-2 row-start-2 row-span-2 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-accent-natal/10 to-transparent p-4 text-center">
              <p className="text-xs tracking-[0.3em] text-text-muted">紫微斗數</p>
              <p className="mt-4 text-2xl font-semibold text-accent-natal">{t(chart.wuxingJuName)}</p>
              <p className="mt-3 text-sm text-text-secondary">命主 {t(chart.mingZhu ?? "—")} · 身主 {t(chart.shenZhu ?? "—")}</p>
              <p className="mt-2 text-xs text-text-muted">命宮在{BRANCH_LABELS[chart.mingGongBranch]} · 身宮在{BRANCH_LABELS[chart.shenGongBranch]}</p>
              <p className="mt-4 text-xs text-text-muted">原始出生資料維持不變</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary sm:hidden">命主 {t(chart.mingZhu ?? "—")} · 身主 {t(chart.shenZhu ?? "—")}</p>
        </CardContent>
      </Card>

      <Card aria-label="宮位詳情" aria-live="polite">
        <CardHeader><CardTitle>{t(selected.name)} · {STEM_LABELS[selected.stem]}{BRANCH_LABELS[selected.branch]}{selected.isShenGong ? " · 身宮" : ""}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {selected.isEmpty && <p className="text-sm text-text-secondary">本宮無主星；對宮為{t(selected.borrowedFromName ?? "")}，可參照{selected.borrowedStars?.map(t).join("、") || "對宮星曜"}。借星不改變原本落宮。</p>}
          {([
            ["major", "主星"], ["lucky", "吉曜"], ["sha", "煞曜"], ["minor", "輔星與雜曜"],
          ] as const).map(([type, label]) => (
            <div key={type} className="flex flex-col gap-2 sm:flex-row">
              <p className="w-24 shrink-0 text-xs text-text-muted">{label}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-primary">
                {selected.stars.filter(s => s.type === type).map(s => <StarLabel key={s.name} star={s} />)}
                {!selected.stars.some(s => s.type === type) && <span className="text-text-muted">—</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>大限一覽</CardTitle><p className="mt-1 text-xs text-text-muted">依引擎虛歲口徑顯示，目前 {chart.currentAge} 歲。點選年齡區間可查看對應本命宮。</p></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {chart.daXians.map((dx, index) => <button key={dx.startAge} type="button" onClick={() => onSelect(dx.palaceBranch)} className={cn("rounded-md border p-3 text-left text-sm", selectedBranch === dx.palaceBranch ? "border-accent-natal/60 bg-accent-natal/10" : "border-border hover:bg-white/5")}>
            <span className="block text-text-primary">{dx.startAge}–{dx.endAge} 歲{index === chart.currentDaXianIndex ? " · 目前" : ""}</span>
            <span className="mt-1 block text-xs text-text-muted">{t(dx.palaceName)} · {BRANCH_LABELS[dx.palaceBranch]}</span>
          </button>)}
        </CardContent>
      </Card>
    </div>
  );
}
