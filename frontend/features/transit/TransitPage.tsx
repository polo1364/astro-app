"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ChartStage } from "@/components/layout/ChartStage";
import { DataPanel } from "@/components/layout/DataPanel";
import { MetaStrip } from "@/components/layout/MetaStrip";
import { ResultBanner } from "@/components/layout/ResultBanner";
import { BirthForm } from "@/components/forms/BirthForm";
import { TransitChartWheel } from "@/components/chart/TransitChartWheel";
import { ChartTabGuide } from "@/components/chart/ChartTabGuide";
import { ChartWheelLegend } from "@/components/chart/ChartWheelLegend";
import { ChartAspectLegend } from "@/components/chart/ChartAspectLegend";
import { TransitAspectTable } from "@/components/chart/TransitAspectTable";
import { TransitPlanetGrid } from "@/components/chart/TransitPlanetGrid";
import { ElementStats } from "@/components/chart/ElementStats";
import {
  TransitAnalysisPanel,
  type TransitAnalysisPanelHandle,
} from "@/components/chart/TransitAnalysisPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input, Label, FieldGroup } from "@/components/ui/FormControls";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { mockTransitResult } from "@/lib/mock/transit";
import { delay } from "@/lib/mock/natal";
import type { TransitResult } from "@/lib/types/transit";
import { normalizeTransitResult } from "@/lib/normalizeTransit";
import { calculateTransit } from "@/lib/api";
import type { BirthFormData } from "@/lib/data/types";
import { defaultBirthData } from "@/lib/data/defaultBirthData";
import { pickSampleBirth, pickSampleTransitDate } from "@/lib/data/randomFill";
import { useChartHistoryContext } from "@/lib/context/ChartHistoryContext";
import { useRegisterChartHistoryPage } from "@/lib/hooks/useRegisterChartHistoryPage";
import { useRegisterBirthProfilePage } from "@/lib/hooks/useRegisterBirthProfilePage";
import { saveChartHistory, updateChartHistory } from "@/lib/storage/chartHistoryDb";
import {
  buildTransitLabel,
  type ChartHistoryRecord,
} from "@/lib/storage/chartHistoryTypes";

export function TransitPage() {
  const [result, setResult] = useState<TransitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [birthData, setBirthData] = useState<BirthFormData>(defaultBirthData);
  const [transitDate, setTransitDate] = useState("2026-06-22");
  const [transitTime, setTransitTime] = useState("12:00");
  const [useTransitTime, setUseTransitTime] = useState(true);
  const [activeTab, setActiveTab] = useState("dual");
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<TransitAnalysisPanelHandle>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const { notifySaved } = useChartHistoryContext();

  const hasBirthTime =
    result?.natal.meta.hasBirthTime !== false && result?.natal.meta.birthTime !== "不詳";

  function handleSampleFill() {
    setBirthData(pickSampleBirth());
    setTransitDate(pickSampleTransitDate());
    setUseTransitTime(true);
    setTransitTime("12:00");
  }

  async function handleSubmit(data: BirthFormData) {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await calculateTransit({
        name: data.name,
        date: data.date,
        time: data.time,
        timezone: data.timezone,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        houseSystem: data.houseSystem,
        location: data.city || data.name,
        birthTimeUnknown: data.birthTimeUnknown,
        transitDate,
        transitTime: useTransitTime ? transitTime : null,
      });
      setResult(res);
      setActiveHistoryId(null);
      setActiveTab("dual");
      try {
        const saved = await saveChartHistory({
          kind: "transit",
          label: buildTransitLabel(data, transitDate, useTransitTime ? transitTime : null),
          birthForm: data,
          transitDate,
          transitTime: useTransitTime ? transitTime : null,
          result: res,
        });
        setActiveHistoryId(saved.id);
        notifySaved("transit", saved.id);
      } catch {
        /* 儲存失敗不阻擋顯示結果 */
      }
    } catch (e) {
      await delay(400);
      if (e instanceof Error && e.message === "STALE_BACKEND") {
        setError(
          "後端版本過舊，尚未包含行運分析模組。請在 backend 目錄重新啟動：py -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload",
        );
        setResult(null);
      } else {
        setResult(normalizeTransitResult(mockTransitResult as unknown as Record<string, unknown>));
        setError("計算服務暫不可用，已顯示預設圖表");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        bannerRef.current?.focus();
        wheelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }

  const handleLoadHistory = useCallback((entry: ChartHistoryRecord) => {
    if (entry.kind !== "transit") return;
    setBirthData(entry.birthForm);
    setTransitDate(entry.transitDate);
    setTransitTime(entry.transitTime ?? "12:00");
    setUseTransitTime(!!entry.transitTime);
    setResult(entry.result);
    setActiveHistoryId(entry.id);
    setError(null);
    setTimeout(() => {
      bannerRef.current?.focus();
      wheelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleAiGenerated = useCallback(
    (sectionsAi: string) => {
      setResult((prev) => {
        if (!prev) return prev;
        const next: TransitResult = {
          ...prev,
          analysis: { ...prev.analysis, sectionsAi },
        };
        if (activeHistoryId) {
          void updateChartHistory(activeHistoryId, { result: next }).then(() => {
            notifySaved("transit", activeHistoryId);
          });
        }
        return next;
      });
      setActiveTab("report");
    },
    [activeHistoryId, notifySaved],
  );

  useRegisterChartHistoryPage("transit", activeHistoryId, handleLoadHistory);

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

  const metaPrimary = result
    ? [
        {
          label: "行運日",
          value: result.transitTime
            ? `${result.transitDate} ${result.transitTime}`
            : result.transitDate,
        },
        { label: "宮位制", value: result.natal.meta.houseSystem },
        { label: "主相位", value: String(result.transitAspects.length) },
      ]
    : [];

  const metaAdvanced = result
    ? [
        { label: "附錄相位", value: String(result.transitAspectsAppendix?.length ?? 0) },
        { label: "UTC", value: result.natal.meta.utc },
      ]
    : [];

  return (
    <>
      <AppShell>
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-text-primary">行運盤</h1>
          <p className="text-caption text-text-secondary mt-1">行運圖分析</p>
        </div>

        {error && <Alert variant="info" className="mb-4">{error}</Alert>}

        {result && (
          <div ref={bannerRef} tabIndex={-1} className="mb-4 outline-none">
            <ResultBanner
              title={result.natal.meta.name || "未命名"}
              subtitle={`行運：${result.transitDate}${result.transitTime ? ` ${result.transitTime}` : ""} · ${result.natal.meta.timezone}`}
              accent="transit"
            />
          </div>
        )}

        <WorkspaceLayout
          inputRail={
            <div className="space-y-4">
              <BirthForm
                value={birthData}
                onChange={setBirthData}
                onSubmit={handleSubmit}
                loading={loading}
                accent="transit"
                onSampleFill={handleSampleFill}
              />
              <Card>
                <CardHeader>
                  <CardTitle>行運時間</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FieldGroup>
                    <Label htmlFor="transit-date">選擇日期</Label>
                    <Input
                      id="transit-date"
                      type="date"
                      value={transitDate}
                      onChange={(e) => setTransitDate(e.target.value)}
                    />
                  </FieldGroup>
                  <label className="flex items-center gap-2 text-body text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTransitTime}
                      onChange={(e) => setUseTransitTime(e.target.checked)}
                      className="rounded border-border"
                    />
                    指定行運時刻（影響月亮與短期精準度）
                  </label>
                  {useTransitTime && (
                    <FieldGroup>
                      <Label htmlFor="transit-time">時刻</Label>
                      <Input
                        id="transit-time"
                        type="time"
                        value={transitTime}
                        onChange={(e) => setTransitTime(e.target.value)}
                      />
                    </FieldGroup>
                  )}
                </CardContent>
              </Card>
            </div>
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
                    <ChartStage label="行運雙盤" accent="transit">
                      <TransitChartWheel
                        natalPlanets={result.natal.planets}
                        transitPlanets={result.transitPlanets}
                        houses={result.natal.houses}
                        transitAspects={result.transitAspects}
                        hasBirthTime={hasBirthTime}
                      />
                    </ChartStage>
                  </div>
                  <MetaStrip items={metaPrimary} advancedItems={metaAdvanced} />
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="dual" className="data-[state=active]:border-accent-transit">
                        雙盤說明
                      </TabsTrigger>
                      <TabsTrigger value="aspects" className="data-[state=active]:border-accent-transit">
                        行運相位
                      </TabsTrigger>
                      <TabsTrigger value="planets" className="data-[state=active]:border-accent-transit">
                        當日行星
                      </TabsTrigger>
                      <TabsTrigger value="report" className="data-[state=active]:border-accent-transit">
                        分析報告
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dual">
                      <div className="glass rounded-lg overflow-hidden">
                        <ChartTabGuide guideKey="transit-dual" />
                        <div className="px-4 pb-2 flex flex-wrap gap-4 text-caption">
                          <span>
                            <span className="text-accent-natal font-medium">內圈</span>
                            <span className="text-text-muted"> 本命盤</span>
                          </span>
                          <span>
                            <span className="text-accent-transit font-medium">外圈</span>
                            <span className="text-text-muted"> 行運盤</span>
                          </span>
                        </div>
                        <ChartWheelLegend planets={result.natal.planets} />
                        <ChartAspectLegend />
                        <div className="px-4 pb-4">
                          <button
                            type="button"
                            onClick={() =>
                              wheelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                            }
                            className="text-caption text-accent-transit hover:text-accent-transit/80 font-medium"
                          >
                            ↑ 回到上方雙盤圖
                          </button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="aspects">
                      <DataPanel title="行運相位">
                        <ChartTabGuide guideKey="transit-aspects" />
                        <TransitAspectTable
                          aspects={result.transitAspects}
                          appendix={result.transitAspectsAppendix}
                          hideHouse={!hasBirthTime}
                        />
                      </DataPanel>
                    </TabsContent>

                    <TabsContent value="planets">
                      <DataPanel title={`${result.transitDate} 行星位置`}>
                        <ChartTabGuide guideKey="transit-planets" />
                        <TransitPlanetGrid
                          planets={result.transitPlanets}
                          hideHouse={!hasBirthTime}
                        />
                      </DataPanel>
                    </TabsContent>

                    <TabsContent value="report">
                      <DataPanel title="行運分析報告">
                        <TransitAnalysisPanel
                          ref={reportRef}
                          transitChartJson={result.transitChartJson ?? {}}
                          analysis={result.analysis}
                          subjectName={result.natal.meta.name}
                          birthDate={result.natal.meta.birthDate}
                          transitDate={result.transitDate}
                          onAiGenerated={handleAiGenerated}
                        />
                      </DataPanel>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <ChartStage label="行運盤" accent="transit">
                  <div className="text-center text-text-muted text-body px-8">
                    填寫出生資料與行運時間後點擊「計算行運」
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
                      <AstroTerm term="元素">元素分布（本命）</AstroTerm>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ElementStats elements={result.natal.elements} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>快速操作</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveTab("report")}
                    >
                      查看分析報告
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => reportRef.current?.generate()}
                    >
                      生成 AI 完整報告
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveTab("aspects")}
                    >
                      查看行運相位表
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-body text-text-muted">
                  計算完成後顯示行運摘要
                </CardContent>
              </Card>
            )
          }
        />
      </AppShell>
    </>
  );
}
