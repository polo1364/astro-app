"use client";

import { forwardRef } from "react";
import { AnalysisShareSection } from "@/components/chart/AnalysisShareSection";
import { colors } from "@/lib/tokens/colors";
import type { NatalAnalysisReport } from "@/lib/mock/natal";
import {
  getShareCardFontFamilies,
  OFFSCREEN_CARD_STYLE,
  parseAiSections,
  SHARE_CARD_WIDTH,
} from "@/lib/utils/analysisReportShare";
import { SITE_NAME } from "@/lib/utils/personalDailyShare";

interface NatalMeta {
  name: string;
  birthDate: string;
  birthTime?: string;
  timezone?: string;
}

interface NatalAnalysisShareCardProps {
  meta: NatalMeta;
  analysis: NatalAnalysisReport;
  aiText: string | null;
}

export const NatalAnalysisShareCard = forwardRef<HTMLDivElement, NatalAnalysisShareCardProps>(
  function NatalAnalysisShareCard({ meta, analysis, aiText }, ref) {
    const name = meta.name?.trim() || "未命名";
    const aiSections = aiText ? parseAiSections(aiText) : [];
    const subtitle = [meta.birthDate, meta.birthTime, meta.timezone].filter(Boolean).join(" · ");
    const fonts = getShareCardFontFamilies();

    return (
      <div aria-hidden className="pointer-events-none" style={OFFSCREEN_CARD_STYLE}>
        <div
          ref={ref}
          data-share-card-content
          style={{
            width: SHARE_CARD_WIDTH,
            backgroundColor: colors.bg.base,
            color: colors.text.primary,
            fontFamily: fonts.body,
            padding: "56px 64px 48px",
            boxSizing: "border-box",
          }}
        >
          <header
            style={{
              marginBottom: 40,
              borderBottom: `1px solid ${colors.accent.border}`,
              paddingBottom: 32,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 28,
                letterSpacing: "0.2em",
                color: colors.text.gold,
                fontWeight: 600,
              }}
            >
              {SITE_NAME}
            </p>
            <h1
              style={{
                margin: "20px 0 8px",
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.25,
                fontFamily: fonts.heading,
                color: colors.text.primary,
              }}
            >
              {name} · 本命分析報告
            </h1>
            {subtitle && (
              <p style={{ margin: 0, fontSize: 26, color: colors.text.secondary }}>{subtitle}</p>
            )}
          </header>

          <AnalysisShareSection
            title={analysis.section1Validity.title}
            body={analysis.section1Validity.text}
            accentColor={colors.report.rule}
            variant="rule"
          />
          <AnalysisShareSection
            title={analysis.section2CoreSummary.title}
            body={analysis.section2CoreSummary.text}
            accentColor={colors.report.rule}
            variant="rule"
          />

          {aiSections.map((sec) => (
            <AnalysisShareSection
              key={sec.title}
              title={sec.title}
              body={sec.body}
              accentColor={colors.report.ai}
              variant="ai"
            />
          ))}

          <footer
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: `1px solid ${colors.accent.border}`,
              fontSize: 20,
              color: colors.text.muted,
              textAlign: "center",
            }}
          >
            Swiss Ephemeris · 本命盤分析
          </footer>
        </div>
      </div>
    );
  },
);
