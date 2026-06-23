"use client";

import { forwardRef } from "react";
import { AnalysisShareSection } from "@/components/chart/AnalysisShareSection";
import { colors } from "@/lib/tokens/colors";
import type { TransitAnalysisReport, TransitAnalysisSection } from "@/lib/types/transit";
import {
  getShareCardFontFamilies,
  OFFSCREEN_CARD_STYLE,
  parseAiSections,
  SHARE_CARD_WIDTH,
} from "@/lib/utils/analysisReportShare";
import { SITE_NAME } from "@/lib/utils/personalDailyShare";
import { sanitizeTransitAiText } from "@/lib/utils/sanitizeTransitAiText";

const RULE_SECTION_KEYS = [
  "section1Validity",
  "section2Highlights",
  "section3LongTerm",
  "section4MidTerm",
  "section5ShortTerm",
  "section6LifeAreas",
  "section7Timing",
  "section8Advice",
  "section9Summary",
] as const;

interface TransitAnalysisShareCardProps {
  subjectName: string;
  birthDate: string;
  transitDate: string;
  analysis: TransitAnalysisReport;
  aiText: string | null;
}

function asSection(value: unknown): TransitAnalysisSection | null {
  if (!value || typeof value !== "object" || !("title" in value) || !("text" in value)) return null;
  return value as TransitAnalysisSection;
}

export const TransitAnalysisShareCard = forwardRef<HTMLDivElement, TransitAnalysisShareCardProps>(
  function TransitAnalysisShareCard(
    { subjectName, birthDate, transitDate, analysis, aiText },
    ref,
  ) {
    const name = subjectName?.trim() || "未命名";
    const sanitizedAi = aiText ? sanitizeTransitAiText(aiText) : null;
    const aiSections = sanitizedAi ? parseAiSections(sanitizedAi) : [];
    const hasAi = aiSections.length > 0;

    const ruleKeys = hasAi
      ? (["section1Validity", "section2Highlights"] as const)
      : RULE_SECTION_KEYS;
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
              {name} · 行運分析報告
            </h1>
            <p style={{ margin: 0, fontSize: 26, color: colors.text.secondary }}>
              出生 {birthDate} · 行運 {transitDate}
            </p>
          </header>

          {ruleKeys.map((key) => {
            const sec = asSection(analysis[key]);
            if (!sec) return null;
            return (
              <AnalysisShareSection
                key={key}
                title={sec.title}
                body={sec.text}
                accentColor={hasAi ? colors.report.rule : colors.accent.transit}
                variant="rule"
              />
            );
          })}

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
            Swiss Ephemeris · 行運盤分析
          </footer>
        </div>
      </div>
    );
  },
);
