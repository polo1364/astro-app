"use client";

import { useState } from "react";
import { Compass, Contact } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BirthFormFields } from "@/components/forms/BirthFormFields";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FieldGroup, Label, Select } from "@/components/ui/FormControls";
import { useBirthProfileContext } from "@/lib/context/BirthProfileContext";
import { useRegisterBirthProfilePage } from "@/lib/hooks/useRegisterBirthProfilePage";
import type { BirthFormData } from "@/lib/data/types";
import type { ZiweiResult } from "@/lib/ziwei/adapter";
import { ZiweiChart } from "./ZiweiChart";

const leapOptions = [
  { value: "split", label: "分半：前十五日歸本月，之後歸下月" },
  { value: "next-month", label: "整個閏月歸下月" },
  { value: "prev-month", label: "整個閏月歸本月" },
  { value: "origin-month", label: "保留原閏月" },
] as const;

export function ZiweiPage() {
  const { sharedForm, setModalOpen } = useBirthProfileContext();
  const { birthData, setBirthData } = sharedForm;
  useRegisterBirthProfilePage(sharedForm);
  const [result, setResult] = useState<ZiweiResult | null>(null);
  const [selectedBranch, setSelectedBranch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stale = result !== null && result.source !== JSON.stringify(birthData);

  function updatePreferences(value: BirthFormData["ziwei"]) {
    setBirthData(current => ({ ...current, ziwei: { ...current.ziwei, ...value } }));
  }

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { calculateZiwei } = await import("@/lib/ziwei/adapter");
      const next = calculateZiwei(birthData);
      setSelectedBranch(next.chart.mingGongBranch);
      setResult(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "排盤失敗，請檢查出生資料後重試。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell className="py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs tracking-[0.25em] text-accent-natal">東方星圖</p>
          <h1 className="text-2xl font-semibold text-text-primary">紫微斗數</h1>
          <p className="mt-2 text-sm text-text-secondary">從十二宮認識命盤。與本命盤、行運盤共用出生資料。</p>
        </div>
        <Button variant="secondary" onClick={() => setModalOpen(true)}><Contact className="size-4" />儲存／帶入基本資料</Button>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>出生資料</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <BirthFormFields data={birthData} onChange={setBirthData} variant="ziwei" idPrefix="ziwei" />
              <details className="rounded-md border border-border p-3">
                <summary className="cursor-pointer text-sm text-text-secondary">排盤規則</summary>
                <div className="mt-3 space-y-3">
                  <FieldGroup>
                    <Label htmlFor="ziwei-late">晚子時（23:00–23:59）</Label>
                    <Select id="ziwei-late" value={birthData.ziwei?.lateZi ?? "next-day"} onChange={e => updatePreferences({ lateZi: e.target.value === "current-day" ? "current-day" : "next-day" })}>
                      <option value="next-day">以次日排盤（預設）</option>
                      <option value="current-day">以當日排盤</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup>
                    <Label htmlFor="ziwei-leap">閏月歸屬</Label>
                    <Select id="ziwei-leap" value={birthData.ziwei?.leapMonth ?? "split"} onChange={e => {
                      const option = leapOptions.find(item => item.value === e.target.value);
                      if (option) updatePreferences({ leapMonth: option.value });
                    }}>{leapOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
                  </FieldGroup>
                </div>
              </details>
              <p className="text-xs leading-relaxed text-text-muted">以所填時區的當地鐘錶時間取時辰，不做真太陽時或夏令時校正。若出生紀錄使用夏令時間，請先確認時間口徑。</p>
              <Button className="w-full" disabled={loading} onClick={() => void handleCalculate()}>{loading ? "排盤中…" : "排紫微命盤"}</Button>
              {error && <Alert variant="error">{error}</Alert>}
            </CardContent>
          </Card>
          <p className="px-1 text-xs leading-relaxed text-text-muted">排盤在此瀏覽器內完成，不需 AI 金鑰。需要日後使用時，請透過「基本資料」儲存至本機。</p>
        </aside>
        <section className="min-w-0 space-y-4">
          {stale && <Alert variant="info">出生資料或規則已變更，下方仍是上次的命盤，請按「排紫微命盤」更新。</Alert>}
          {result ? <>
            <div className="rounded-lg border border-border bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-text-secondary">
              排盤日期 {result.input.year}-{String(result.input.month).padStart(2, "0")}-{String(result.input.day).padStart(2, "0")} · 晚子時{result.lateZi === "next-day" ? "歸次日" : "歸當日"} · 閏月{leapOptions.find(item => item.value === result.leapMonth)?.label}
              {result.dayOffset !== 0 && <span className="mt-1 block text-accent-natal">晚子時已按規則換日；共用出生日期仍保留 {result.original.date}。</span>}
            </div>
            <ZiweiChart result={result} selectedBranch={selectedBranch} onSelect={setSelectedBranch} />
          </> : <Card className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <Compass className="mb-5 size-12 text-accent-natal/60" strokeWidth={1} />
            <h2 className="text-lg font-medium text-text-primary">展開你的十二宮命盤</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">帶入已儲存的出生資料，確認出生時間與排盤性別，即可查看星曜、四化及大限。</p>
          </Card>}
          <p className="text-xs leading-relaxed text-text-muted">排盤引擎：<a href="https://github.com/Renhuai123/ziwei-doushu" target="_blank" rel="noopener noreferrer" className="underline hover:text-text-primary">Renhuai123 / ziwei-doushu</a>（MIT），基於 iztro。此頁呈現排盤資料與傳統術語，不含上游付費解讀。</p>
        </section>
      </div>
    </AppShell>
  );
}
