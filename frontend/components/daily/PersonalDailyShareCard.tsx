"use client";

import { forwardRef } from "react";
import type { PersonalDailySections } from "@/lib/types/personalDailyHoroscope";
import { PERSONAL_DAILY_SECTION_LABELS } from "@/lib/types/personalDailyHoroscope";
import { PERSONAL_DAILY_SECTION_STYLE_MAP } from "@/lib/tokens/personalDailyHoroscopeSections";
import { colors } from "@/lib/tokens/colors";
import { formatTaipeiDisplayDate } from "@/lib/utils/taipeiDate";
import { getShareCardFontFamilies } from "@/lib/utils/analysisReportShare";
import { highlightReport } from "@/lib/utils/highlightReport";
import { COMPACT_SHARE_SECTIONS, SITE_NAME } from "@/lib/utils/personalDailyShare";

const CARD_WIDTH = 1080;

interface PersonalDailyShareCardProps {
  displayName: string;
  date: string;
  sections: PersonalDailySections;
}

export const PersonalDailyShareCard = forwardRef<
  HTMLDivElement,
  PersonalDailyShareCardProps
>(function PersonalDailyShareCard({ displayName, date, sections }, ref) {
  const name = displayName || "你";
  const dateLabel = formatTaipeiDisplayDate(date);
  const fonts = getShareCardFontFamilies();

  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: CARD_WIDTH,
        opacity: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <div
        ref={ref}
        data-share-card-content
        style={{
          width: CARD_WIDTH,
          backgroundColor: colors.bg.base,
          color: colors.text.primary,
          fontFamily: fonts.body,
          padding: "56px 64px 48px",
          boxSizing: "border-box",
        }}
      >
        <header style={{ marginBottom: 40, borderBottom: `1px solid ${colors.accent.border}`, paddingBottom: 32 }}>
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
            {name} 的個人今日運勢
          </h1>
          <p style={{ margin: 0, fontSize: 26, color: colors.text.secondary }}>
            {dateLabel}
          </p>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {COMPACT_SHARE_SECTIONS.map((key) => {
            const style = PERSONAL_DAILY_SECTION_STYLE_MAP[key];
            const body = sections[key]?.trim() ?? "";
            if (!body) return null;
            return (
              <section
                key={key}
                style={{
                  borderLeft: `4px solid ${style.color}`,
                  paddingLeft: 20,
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 26,
                    fontWeight: 600,
                    color: style.color,
                  }}
                >
                  {PERSONAL_DAILY_SECTION_LABELS[key]}
                </p>
                <div
                  style={{
                    fontSize: 24,
                    lineHeight: 1.6,
                    color: colors.text.primary,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {highlightReport(body, true, "share")}
                </div>
              </section>
            );
          })}
        </div>

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
          Swiss Ephemeris · 個人化每日行運
        </footer>
      </div>
    </div>
  );
});
