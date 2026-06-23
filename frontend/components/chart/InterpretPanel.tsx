"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { highlightReport } from "@/lib/utils/highlightReport";
import { interpretNatal, interpretTransit } from "@/lib/api";

interface InterpretPanelProps {
  type: "natal" | "transit";
  chartSummary: object;
  onOpenSettings?: () => void;
}

const mockInterpretation = `## 整體概況
太陽落在獅子座第十宮，展現強烈的公眾形象與領導慾望。月亮天蠍合相冥王星於第一宮，情感深刻且具穿透力，對自我認同有強烈需求。

## 重點相位
月亮合冥王星（容許 0°46′）為本命盤核心動力，情感強度極高。太陽合中天強化事業志向，適合在需要展現個人魅力的領域發展。

## 建議
善用獅子座的創造力與天蠍座的深度，在專業領域建立獨特個人品牌。注意情感邊界，避免過度控制或執著。`;

export function InterpretPanel({ type, chartSummary, onOpenSettings }: InterpretPanelProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const fn = type === "natal" ? interpretNatal : interpretTransit;
      const result = await fn(chartSummary);
      setText(result.text);
      setUseMock(false);
    } catch {
      setUseMock(true);
      setText(mockInterpretation);
      setError("計算服務暫不可用，已顯示參考解讀。請啟動計算服務並於解讀設定中配置 API Key。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-body font-semibold text-report-ai flex items-center gap-2">
          <Sparkles className="size-5" />
          星盤文字解讀
        </h4>
        {!text && !loading && (
          <Button size="md" onClick={handleGenerate}>
            生成解讀
          </Button>
        )}
      </div>

      {loading && (
        <div className="space-y-3 rounded-md border border-report-ai/30 bg-report-ai/5 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex items-center gap-2 pt-1">
            <Spinner className="size-5" />
            <span className="text-caption text-report-ai">解讀生成中…</span>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="info">
          {error}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="underline ml-1 text-accent-natal"
            >
              前往設定
            </button>
          )}
        </Alert>
      )}

      {!loading && !text && !error && (
        <EmptyState
          icon={Sparkles}
          title="尚未生成星盤解讀"
          description="點擊「生成解讀」取得繁中命盤分析。需先於解讀設定中配置 API Key。"
        />
      )}

      {text && !loading && (
        <div className="rounded-md border border-l-4 border-l-report-ai bg-report-ai/5 p-4 text-body-lg leading-7 text-text-primary space-y-3 whitespace-pre-line">
          {text.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <p key={i} className="font-semibold text-report-ai text-body mt-4 first:mt-0">
                  {line.replace("## ", "")}
                </p>
              );
            }
            return line ? (
              <p key={i} className="text-text-primary">
                {highlightReport(line)}
              </p>
            ) : null;
          })}
          {useMock && (
            <p className="text-caption text-text-muted italic">（參考內容）</p>
          )}
        </div>
      )}
    </div>
  );
}
