"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ReportSection } from "@/components/chart/ReportSection";
import { interpretTransit } from "@/lib/api";
import {
  finishSimulatedProgress,
  useSimulatedProgress,
} from "@/lib/hooks/useSimulatedProgress";
import type { TransitAnalysisReport, TransitAnalysisSection } from "@/lib/types/transit";
import { cn } from "@/lib/utils";
import { sanitizeTransitAiText } from "@/lib/utils/sanitizeTransitAiText";

export interface TransitAnalysisPanelHandle {
  generate: () => void;
}

interface TransitAnalysisPanelProps {
  transitChartJson: Record<string, unknown>;
  analysis: TransitAnalysisReport;
  onAiGenerated?: (sectionsAi: string) => void;
}

function parseAiSections(text: string): { title: string; body: string }[] {
  const parts = text.split(/^##\s*/m).filter(Boolean);
  return parts.map((part) => {
    const nl = part.indexOf("\n");
    const title = nl === -1 ? part.trim() : part.slice(0, nl).trim();
    const body = nl === -1 ? "" : part.slice(nl + 1).trim();
    return { title, body };
  });
}

const RULE_SECTION_KEYS: (keyof TransitAnalysisReport)[] = [
  "section1Validity",
  "section2Highlights",
  "section3LongTerm",
  "section4MidTerm",
  "section5ShortTerm",
  "section6LifeAreas",
  "section7Timing",
  "section8Advice",
  "section9Summary",
];

const RULE_DETAIL_KEYS: (keyof TransitAnalysisReport)[] = RULE_SECTION_KEYS.slice(2);

function highlightBullets(text: string, max = 3): string[] {
  return text
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

export const TransitAnalysisPanel = forwardRef<TransitAnalysisPanelHandle, TransitAnalysisPanelProps>(
  function TransitAnalysisPanel({ transitChartJson, analysis, onAiGenerated }, ref) {
    const [aiText, setAiText] = useState<string | null>(
      analysis.sectionsAi ? sanitizeTransitAiText(analysis.sectionsAi) : null,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [fullOpen, setFullOpen] = useState(false);
    useSimulatedProgress(loading, setProgress);

    useEffect(() => {
      setAiText(analysis.sectionsAi ? sanitizeTransitAiText(analysis.sectionsAi) : null);
    }, [analysis.sectionsAi]);

    async function handleGenerate() {
      setLoading(true);
      setProgress(0);
      setError(null);
      try {
        const res = await interpretTransit({ transitChartJson });
        await finishSimulatedProgress(setProgress);
        const raw = res.sectionsAi ?? res.text;
        const text = sanitizeTransitAiText(raw);
        setAiText(text);
        setFullOpen(true);
        onAiGenerated?.(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "生成失敗，請於頂部「解讀設定」配置 DeepSeek API Key");
      } finally {
        setLoading(false);
        setProgress(0);
      }
    }

    useImperativeHandle(ref, () => ({ generate: handleGenerate }));

    const aiSections = aiText ? parseAiSections(aiText) : [];
    const hasFullReport = aiSections.length > 0;
    const hasTcj = transitChartJson && Object.keys(transitChartJson).length > 0;

    const s1 = analysis.section1Validity as TransitAnalysisSection | undefined;
    const s2 = analysis.section2Highlights as TransitAnalysisSection | undefined;
    const quickBullets = s2 ? highlightBullets(s2.text, 3) : [];

    return (
      <div id="transit-report-panel" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-body font-semibold text-accent-transit flex items-center gap-2">
            <Sparkles className="size-5" />
            行運分析報告
            <Badge variant="muted" className="text-label font-normal">規則引擎</Badge>
            {hasFullReport && (
              <Badge variant="natal" className="text-label font-normal">AI 解讀</Badge>
            )}
          </h4>
          {!loading && (
            <Button
              id="transit-full-report-btn"
              size="md"
              onClick={handleGenerate}
              disabled={!hasTcj}
            >
              {hasFullReport ? "重新生成完整報告" : "生成完整報告（A 至 I 段）"}
            </Button>
          )}
        </div>

        {/* 速覽區 */}
        <div className="rounded-md border border-accent-transit/25 bg-accent-transit/8 px-4 py-3 space-y-3">
          {s1 && (
            <p className="text-body text-text-primary leading-relaxed">{s1.text}</p>
          )}
          {quickBullets.length > 0 && (
            <ul className="space-y-2 text-body text-text-primary list-disc pl-5">
              {quickBullets.map((line, i) => (
                <li key={i} className="leading-relaxed">{line}</li>
              ))}
            </ul>
          )}
          {!hasFullReport && (
            <p className="text-caption text-text-secondary">
              下方可展開完整九段規則摘要；需要更白話的解讀可點上方生成 AI 報告。
            </p>
          )}
          {hasFullReport && (
            <p className="text-caption text-text-secondary">
              已生成 AI 完整解讀，展開下方查看 A 至 I 段；規則引擎僅保留資料檢查與重點摘要。
            </p>
          )}
        </div>

        {/* 完整報告（預設收合） */}
        <div className="rounded-md border border-border/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setFullOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left bg-surface/50 hover:bg-surface/80 transition-colors"
          >
            <span className="text-body font-medium text-text-primary">
              {hasFullReport ? "完整 AI 解讀（A 至 I 段）" : "完整規則報告（三至九段）"}
            </span>
            {fullOpen ? (
              <ChevronUp className="size-5 text-text-muted shrink-0" />
            ) : (
              <ChevronDown className="size-5 text-text-muted shrink-0" />
            )}
          </button>

          {fullOpen && (
            <div className={cn("px-4 pb-4 pt-2 space-y-3 border-t border-border/40")}>
              {!hasFullReport &&
                RULE_DETAIL_KEYS.map((key) => {
                  const sec = analysis[key];
                  if (!sec || typeof sec !== "object" || !("title" in sec)) return null;
                  return (
                    <ReportSection
                      key={key}
                      title={sec.title}
                      text={sec.text}
                      evidence={sec.evidence ?? sec.lines}
                      variant="rule"
                      defaultOpen={false}
                      showVariantBadge={false}
                    />
                  );
                })}

              {aiSections.map((sec) => (
                <ReportSection
                  key={sec.title}
                  title={sec.title}
                  text={sec.body}
                  variant="ai"
                  defaultOpen={sec.title.includes("總結") || sec.title.startsWith("I")}
                  showVariantBadge={false}
                />
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-3 rounded-md border border-report-ai/30 bg-report-ai/5 p-4">
            <ProgressBar value={progress} label="正在生成 AI 完整行運報告（A 至 I 段）" />
            <p className="text-caption text-text-secondary">約需 30～60 秒，請稍候…</p>
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}
      </div>
    );
  },
);
