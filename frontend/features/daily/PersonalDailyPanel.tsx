"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Orbit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BirthForm } from "@/components/forms/BirthForm";
import { Spinner } from "@/components/ui/Spinner";
import { DailyHoroscopeSection } from "@/components/daily/DailyHoroscopeSection";
import { PersonalDailyShareBar } from "@/components/daily/PersonalDailyShareBar";
import { defaultBirthData } from "@/lib/data/defaultBirthData";
import type { BirthFormData } from "@/lib/data/types";
import { usePersonalDailyHoroscope } from "@/lib/hooks/usePersonalDailyHoroscope";
import { useRegisterBirthProfilePage } from "@/lib/hooks/useRegisterBirthProfilePage";
import { PERSONAL_DAILY_SECTION_ORDER } from "@/lib/types/personalDailyHoroscope";

interface PersonalDailyPanelProps {
  onBack: () => void;
}

export function PersonalDailyPanel({ onBack }: PersonalDailyPanelProps) {
  const [birthData, setBirthData] = useState<BirthFormData>(defaultBirthData);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const { result, loading, error, generate } = usePersonalDailyHoroscope();

  const profileHandlers = useMemo(
    () => ({
      birthData,
      setBirthData,
      activeProfileId,
      setActiveProfileId,
    }),
    [birthData, activeProfileId],
  );
  useRegisterBirthProfilePage(profileHandlers);

  async function handleSubmit(data: BirthFormData) {
    setSubmittedName(data.name || "你");
    const profileId = activeProfileId ?? crypto.randomUUID();
    if (!activeProfileId) {
      setActiveProfileId(profileId);
    }
    await generate(data, profileId);
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ClientIcon icon={ArrowLeft} className="size-4" />
          返回首頁
        </Button>
      </div>

      <header className="mb-8">
        <p className="text-caption text-text-muted uppercase tracking-widest mb-2">
          每日運勢 · 個人版
        </p>
        <h1
          className="text-2xl sm:text-3xl font-semibold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          個人今日運勢
        </h1>
        <p className="text-caption text-text-muted mt-2">
          依出生資料與今日行運推算（約需 1–2 分鐘）
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <BirthForm
          value={birthData}
          onChange={setBirthData}
          onSubmit={handleSubmit}
          loading={loading}
          accent="natal"
          showSampleFill
          submitLabel="生成今日運勢"
        />

        <Card className="min-h-[320px]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle>運勢解讀</CardTitle>
            {!loading && result && (
              <PersonalDailyShareBar
                result={result}
                displayName={submittedName ?? "你"}
                className="shrink-0"
              />
            )}
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Spinner className="size-8 text-accent-natal" />
                <p className="text-caption text-text-muted">正在生成個人運勢…</p>
                <p className="text-caption text-text-muted">星曆計算與 AI 文案約需 1–2 分鐘</p>
              </div>
            )}

            {!loading && error && (
              <p className="text-body text-status-blocked">{error}</p>
            )}

            {!loading && !result && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-body text-text-muted">
                  填寫左側出生資料後，點擊「生成今日運勢」。
                </p>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4">
                <p className="text-body text-text-secondary">
                  {submittedName}，以下為 {result.date} 個人運勢
                  {result.cached ? "（快取）" : ""}：
                </p>
                {result.dataValidity && !result.dataValidity.canUseHouses && (
                  <p className="text-caption text-status-warn">
                    未提供出生時間，宮位與上升相關分析已降級。
                  </p>
                )}
                {PERSONAL_DAILY_SECTION_ORDER.map((key) => (
                  <DailyHoroscopeSection
                    key={key}
                    sectionKey={key}
                    body={result.sections[key]}
                    variant="personal"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <p className="text-caption text-text-muted">
          想查看完整行運盤與相位分析？
        </p>
        <Link href="/transit">
          <Button variant="secondary" size="sm">
            <ClientIcon icon={Orbit} className="size-3.5" />
            前往行運盤
          </Button>
        </Link>
      </div>
    </div>
  );
}
