"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { PageContainer } from "@/components/layout/PageContainer";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ChartStage } from "@/components/layout/ChartStage";
import { DataPanel } from "@/components/layout/DataPanel";
import { MetaStrip } from "@/components/layout/MetaStrip";
import { ResultBanner } from "@/components/layout/ResultBanner";
import { BirthForm } from "@/components/forms/BirthForm";
import { NatalChartWheel } from "@/components/chart/NatalChartWheel";
import { ChartTabGuide } from "@/components/chart/ChartTabGuide";
import { ChartWheelLegend } from "@/components/chart/ChartWheelLegend";
import { ChartAspectLegend } from "@/components/chart/ChartAspectLegend";
import { PlanetTable } from "@/components/chart/PlanetTable";
import { AspectTable } from "@/components/chart/AspectTable";
import { HouseTable } from "@/components/chart/HouseTable";
import { ElementStats } from "@/components/chart/ElementStats";
import { PatternList } from "@/components/chart/PatternList";
import {
  NatalAnalysisPanel,
  type NatalAnalysisPanelHandle,
} from "@/components/chart/NatalAnalysisPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { mockNatalResult, delay } from "@/lib/mock/natal";
import { normalizeNatalResult } from "@/lib/normalizeNatal";
import type { NatalResult } from "@/lib/mock/natal";
import { calculateNatal } from "@/lib/api";
import type { BirthFormData } from "@/lib/data/types";
import { defaultBirthData } from "@/lib/data/defaultBirthData";
import { plainStatsHint } from "@/lib/data/plainLanguage";
import { useChartHistoryContext } from "@/lib/context/ChartHistoryContext";
import { useRegisterChartHistoryPage } from "@/lib/hooks/useRegisterChartHistoryPage";
import { useRegisterBirthProfilePage } from "@/lib/hooks/useRegisterBirthProfilePage";
import { saveChartHistory, updateChartHistory } from "@/lib/storage/chartHistoryDb";
import {
  buildNatalLabel,
  type ChartHistoryRecord,
} from "@/lib/storage/chartHistoryTypes";

export function NatalPage() {
  const [birthData, setBirthData] = useState<BirthFormData>(defaultBirthData);
  const [result, setResult] = useState<NatalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const { notifySaved } = useChartHistoryContext();
  const bannerRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<NatalAnalysisPanelHandle>(null);
  const reportSectionRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(data: BirthFormData) {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await calculateNatal({
        name: data.name,
        date: data.date,
        time: data.birthTimeUnknown ? null : data.time,
        timezone: data.timezone,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        houseSystem: data.houseSystem,
        location: data.city || data.name,
        birthTimeUnknown: data.birthTimeUnknown,
      });
      setResult(res);
      setActiveHistoryId(null);
      try {
        const saved = await saveChartHistory({
          kind: "natal",
          label: buildNatalLabel(data),
          birthForm: data,
          result: res,
        });
        setActiveHistoryId(saved.id);
        notifySaved("natal", saved.id);
      } catch {
        /* 儲存失敗不阻擋顯示結果 */
      }
    } catch (e) {
      await delay(400);
      if (e instanceof Error && e.message === "STALE_BACKEND") {
        setError(
          "後端版本過舊，尚未包含分析模組。請在 backend 目錄重新啟動：py -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload",
        );
        setResult(null);
      } else {
        setResult(normalizeNatalResult(mockNatalResult as unknown as Record<string, unknown>));
        setError("計算服務暫不可用，已顯示預設圖表");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        bannerRef.current?.focus();
        reportSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }

  const handleLoadHistory = useCallback((entry: ChartHistoryRecord) => {
    if (entry.kind !== "natal") return;
    setBirthData(entry.birthForm);
    setResult(entry.result);
    setActiveHistoryId(entry.id);
    setError(null);
    setTimeout(() => {
      bannerRef.current?.focus();
      reportSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleAiGenerated = useCallback(
    (sectionsAi: string) => {
      setResult((prev) => {
        if (!prev) return prev;
        const next: NatalResult = {
          ...prev,
          analysis: { ...prev.analysis, sectionsAi },
        };
        if (activeHistoryId) {
          void updateChartHistory(activeHistoryId, { result: next }).then(() => {
            notifySaved("natal", activeHistoryId);
          });
        }
        return next;
      });
    },
    [activeHistoryId, notifySaved],
  );

  useRegisterChartHistoryPage("natal", activeHistoryId, handleLoadHistory);

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

  const hasBirthTime = result?.meta.hasBirthTime !== false
    && result?.meta.birthTime !== "不詳";

  const metaPrimary = result
    ? [{ label: "宮位制", value: result.meta.houseSystem }]
    : [];

  const metaAdvanced = result
    ? [
        { label: "UTC", value: result.meta.utc },
        { label: "儒略日", value: result.meta.julianDay },
      ]
    : [];

  return (
    <>
      <TopNav />
      <PageContainer>
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-text-primary">本命盤</h1>
          <p className="text-caption text-text-secondary mt-1">出生圖分析</p>
        </div>

        {error && (
          <Alert variant="info" className="mb-4">{error}</Alert>
        )}

        {result && (
          <div ref={bannerRef} tabIndex={-1} className="mb-4 outline-none">
            <ResultBanner
              title={result.meta.name || "未命名"}
              subtitle={`${result.meta.birthDate} ${result.meta.birthTime} · ${result.meta.timezone}`}
              accent="natal"
            />
          </div>
        )}

        {result && (
          <div ref={reportSectionRef} className="mb-4">
            <Card className="border-accent-natal/25">
              <CardContent className="pt-4">
                <NatalAnalysisPanel
                  ref={reportRef}
                  chartJson={result.chartJson ?? {}}
                  analysis={result.analysis}
                  onAiGenerated={handleAiGenerated}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <WorkspaceLayout
          inputRail={
            <BirthForm
              value={birthData}
              onChange={setBirthData}
              onSubmit={handleSubmit}
              loading={loading}
              accent="natal"
            />
          }
          chartStage={
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="w-full max-w-[420px] aspect-square rounded-full" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ) : result ? (
                <>
                  <div ref={wheelRef}>
                    <ChartStage label="本命盤" accent="natal">
                      <NatalChartWheel
                        planets={result.planets}
                        aspects={result.aspects}
                        houses={result.houses}
                        hasBirthTime={hasBirthTime}
                        accent="natal"
                      />
                    </ChartStage>
                  </div>
                  <MetaStrip items={metaPrimary} advancedItems={metaAdvanced} />
                  <Tabs defaultValue="planets">
                    <TabsList>
                      <TabsTrigger value="chart">星盤</TabsTrigger>
                      <TabsTrigger value="planets">行星</TabsTrigger>
                      <TabsTrigger value="aspects">相位</TabsTrigger>
                      <TabsTrigger value="houses" disabled={!hasBirthTime}>
                        宮位
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="chart">
                      <div className="glass rounded-lg overflow-hidden">
                        <ChartTabGuide guideKey="chart" />
                        <ChartWheelLegend planets={result.planets} />
                        <ChartAspectLegend />
                        <div className="px-4 pb-4">
                          <button
                            type="button"
                            onClick={() =>
                              wheelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                            }
                            className="text-caption text-accent-natal hover:text-accent-natal/80 font-medium"
                          >
                            ↑ 回到上方星盤圖檢視
                          </button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="planets">
                      <DataPanel>
                        <ChartTabGuide guideKey="planets" />
                        <PlanetTable planets={result.planets} hideHouse={!hasBirthTime} />
                      </DataPanel>
                    </TabsContent>
                    <TabsContent value="aspects">
                      <DataPanel>
                        <ChartTabGuide guideKey="aspects" />
                        <AspectTable aspects={result.aspects} />
                      </DataPanel>
                    </TabsContent>
                    <TabsContent value="houses">
                      <DataPanel>
                        <ChartTabGuide guideKey="houses" />
                        {hasBirthTime ? (
                          <HouseTable houses={result.houses} />
                        ) : (
                          <p className="text-body text-text-muted px-3 py-5">
                            出生時間不詳時無法計算宮位。請提供出生時間以查看此資料。
                          </p>
                        )}
                      </DataPanel>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <ChartStage label="本命盤" accent="natal">
                  <div className="text-center text-text-muted text-body px-8">
                    填寫左側出生資料後點擊「計算命盤」
                  </div>
                </ChartStage>
              )}
            </div>
          }
          insightRail={
            result ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <AstroTerm term="元素">元素分布</AstroTerm>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ElementStats elements={result.elements} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>統計摘要</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-body">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">主導元素</span>
                        <span className="text-text-gold font-medium">
                          <AstroTerm term={result.stats.dominantElement}>
                            {result.stats.dominantElement}
                          </AstroTerm>
                        </span>
                      </div>
                      <p className="text-caption text-text-muted mt-1">
                        {plainStatsHint("element", result.stats.dominantElement)}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">主導模式</span>
                        <span className="text-accent-natal font-medium">
                          <AstroTerm term={result.stats.dominantModality}>
                            {result.stats.dominantModality}
                          </AstroTerm>
                        </span>
                      </div>
                      <p className="text-caption text-text-muted mt-1">
                        {plainStatsHint("modality", result.stats.dominantModality)}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">盤型</span>
                        <span className="text-text-primary font-medium">{result.stats.chartShape}</span>
                      </div>
                      <p className="text-caption text-text-muted mt-1">
                        {plainStatsHint("shape", result.stats.chartShape)}
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">逆行行星</span>
                        <span className="tabular-nums text-status-warn font-medium">
                          {result.stats.retrogradeCount}
                        </span>
                      </div>
                      <p className="text-caption text-text-muted mt-1">
                        {plainStatsHint("retrograde", result.stats.retrogradeCount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <AstroTerm term="格局">格局</AstroTerm>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PatternList patterns={result.patterns} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-body text-text-muted">
                  計算完成後顯示分析面板
                </CardContent>
              </Card>
            )
          }
        />
      </PageContainer>
    </>
  );
}
