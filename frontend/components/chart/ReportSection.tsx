"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { highlightReport, renderAiReportBody } from "@/lib/utils/highlightReport";

export type ReportSectionVariant = "rule" | "ai";

interface ReportSectionProps {
  title: string;
  text: string;
  evidence?: string[];
  variant?: ReportSectionVariant;
  defaultOpen?: boolean;
  showVariantBadge?: boolean;
}

const variantStyles: Record<
  ReportSectionVariant,
  { border: string; title: string; bg: string }
> = {
  rule: {
    border: "border-l-report-rule",
    title: "text-report-rule",
    bg: "bg-report-rule/5",
  },
  ai: {
    border: "border-l-report-ai",
    title: "text-report-ai",
    bg: "bg-report-ai/5",
  },
};

export function ReportSection({
  title,
  text,
  evidence,
  variant = "rule",
  defaultOpen = true,
  showVariantBadge = true,
}: ReportSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [showEvidence, setShowEvidence] = useState(false);
  const styles = variantStyles[variant];
  const bodyText = text.replace(/^##\s*[^\n]+\n?/, "");

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 border-l-4",
        styles.border,
        styles.bg,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className={cn("text-body font-semibold", styles.title)}>{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {showVariantBadge && variant === "ai" && (
            <Badge variant="natal" className="text-label">
              AI 解讀
            </Badge>
          )}
          {showVariantBadge && variant === "rule" && (
            <Badge variant="muted" className="text-label">
              規則引擎
            </Badge>
          )}
          {open ? (
            <ChevronUp className="size-5 text-text-muted" />
          ) : (
            <ChevronDown className="size-5 text-text-muted" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {variant === "ai" ? (
            renderAiReportBody(bodyText)
          ) : (
            <div className="text-body-lg leading-7 text-text-primary whitespace-pre-wrap">
              {highlightReport(bodyText)}
            </div>
          )}
          {evidence && evidence.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowEvidence((s) => !s)}
                className="text-caption font-medium text-report-evidence hover:text-report-evidence/80"
              >
                {showEvidence ? "隱藏" : "顯示"}盤面依據（進階）
              </button>
              {showEvidence && (
                <ul className="mt-2 text-caption text-report-evidence list-disc pl-5 space-y-1">
                  {evidence.map((e, i) => (
                    <li key={i}>{highlightReport(e)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
