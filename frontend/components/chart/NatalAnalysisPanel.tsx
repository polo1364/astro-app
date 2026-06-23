"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Alert } from "@/components/ui/Alert";
import { ReportSection } from "@/components/chart/ReportSection";
import { interpretNatal } from "@/lib/api";
import {
  finishSimulatedProgress,
  useSimulatedProgress,
} from "@/lib/hooks/useSimulatedProgress";
import type { NatalAnalysisReport } from "@/lib/mock/natal";

export interface NatalAnalysisPanelHandle {
  generate: () => void;
}

interface NatalAnalysisPanelProps {
  chartJson: Record<string, unknown>;
  analysis: NatalAnalysisReport;
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

export const NatalAnalysisPanel = forwardRef<NatalAnalysisPanelHandle, NatalAnalysisPanelProps>(
  function NatalAnalysisPanel({ chartJson, analysis, onAiGenerated }, ref) {
    const [aiText, setAiText] = useState<string | null>(analysis.sectionsAi ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    useSimulatedProgress(loading, setProgress);

    useEffect(() => {
      setAiText(analysis.sectionsAi ?? null);
    }, [analysis.sectionsAi]);

    async function handleGenerate() {
      setLoading(true);
      setProgress(0);
      setError(null);
      try {
        const res = await interpretNatal({ chartJson });
        await finishSimulatedProgress(setProgress);
        const text = res.sectionsAi ?? res.text;
        setAiText(text);
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

    return (
      <div id="natal-report-panel" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-body font-semibold text-accent-natal flex items-center gap-2">
            <Sparkles className="size-5" />
            命盤分析報告
          </h4>
          {!loading && (
            <Button
              id="natal-full-report-btn"
              size="md"
              onClick={handleGenerate}
              disabled={!chartJson || Object.keys(chartJson).length === 0}
            >
              {hasFullReport ? "重新生成完整報告" : "生成完整報告（三至十段）"}
            </Button>
          )}
        </div>

        <p className="text-caption text-text-muted leading-relaxed">
          下面先說資料夠不夠算，再說你最核心的個性輪廓；需要更完整解讀可再生成 AI 段落。
        </p>

        {!hasFullReport && !loading && (
          <p className="text-caption text-text-secondary rounded-md border border-report-rule/30 bg-report-rule/10 px-4 py-3 leading-relaxed">
            <span className="text-report-rule font-medium">規則引擎</span>
            {" "}已顯示前兩段。點擊上方按鈕可生成
            <span className="text-report-ai font-medium"> AI 白話解讀</span>
            （三至十段，需 DeepSeek API Key）。
          </p>
        )}

        <ReportSection
          title={analysis.section1Validity.title}
          text={analysis.section1Validity.text}
          evidence={analysis.section1Validity.evidence ?? analysis.section1Validity.lines}
          variant="rule"
          defaultOpen={false}
        />
        <ReportSection
          title={analysis.section2CoreSummary.title}
          text={analysis.section2CoreSummary.text}
          evidence={analysis.section2CoreSummary.evidence}
          variant="rule"
          defaultOpen
        />

        {aiSections.map((sec) => (
          <ReportSection
            key={sec.title}
            title={sec.title}
            text={sec.body}
            variant="ai"
            defaultOpen={sec.title.includes("整合")}
          />
        ))}

        {loading && (
          <div className="space-y-3 rounded-md border border-report-ai/30 bg-report-ai/5 p-4">
            <ProgressBar
              value={progress}
              label="正在生成 AI 完整報告（三至十段）"
            />
            <p className="text-caption text-text-muted">
              約需 30～60 秒，請稍候…
            </p>
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}
      </div>
    );
  },
);
