"use client";

import { forwardRef } from "react";
import type { PersonalDailySections } from "@/lib/types/personalDailyHoroscope";
import { PERSONAL_DAILY_SECTION_LABELS } from "@/lib/types/personalDailyHoroscope";
import { PERSONAL_DAILY_SECTION_STYLE_MAP } from "@/lib/tokens/personalDailyHoroscopeSections";
import { colors } from "@/lib/tokens/colors";
import { formatTaipeiDisplayDate } from "@/lib/utils/taipeiDate";
import { COMPACT_SHARE_SECTIONS, SITE_NAME } from "@/lib/utils/personalDailyShare";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

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

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none"
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        zIndex: -1,
      }}
    >
      <div
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor: colors.bg.base,
          color: colors.text.primary,
          fontFamily: "var(--font-noto), 'Noto Sans TC', sans-serif",
          padding: "56px 64px 48px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
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
              fontFamily: "var(--font-cormorant), serif",
            }}
          >
            {name} 的個人今日運勢
          </h1>
          <p style={{ margin: 0, fontSize: 26, color: colors.text.secondary }}>
            {dateLabel}
          </p>
        </header>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22 }}>
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
                    margin: "0 0 6px",
                    fontSize: 24,
                    fontWeight: 600,
                    color: style.color,
                  }}
                >
                  {PERSONAL_DAILY_SECTION_LABELS[key]}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 22,
                    lineHeight: 1.55,
                    color: colors.text.secondary,
                  }}
                >
                  {body}
                </p>
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
