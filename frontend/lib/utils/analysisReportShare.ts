import type { CSSProperties } from "react";
import { SITE_NAME } from "@/lib/utils/personalDailyShare";
import { sanitizeDownloadFilename } from "@/lib/utils/downloadImage";

export const SHARE_CARD_WIDTH = 1080;

/** 留在 viewport 內但不可見，避免 html-to-image 擷取空白圖 */
export const OFFSCREEN_CARD_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: SHARE_CARD_WIDTH,
  opacity: 0,
  pointerEvents: "none",
  zIndex: 0,
};

export function getShareCardFontFamilies(): { body: string; heading: string } {
  if (typeof document === "undefined") {
    return {
      body: "'Noto Sans TC', sans-serif",
      heading: "Georgia, serif",
    };
  }
  const root = getComputedStyle(document.documentElement);
  const noto = root.getPropertyValue("--font-noto").trim();
  const cormorant = root.getPropertyValue("--font-cormorant").trim();
  return {
    body: noto ? `${noto}, 'Noto Sans TC', sans-serif` : "'Noto Sans TC', sans-serif",
    heading: cormorant ? `${cormorant}, Georgia, serif` : "Georgia, serif",
  };
}

export function parseAiSections(text: string): { title: string; body: string }[] {
  const parts = text.split(/^##\s*/m).filter(Boolean);
  return parts.map((part) => {
    const nl = part.indexOf("\n");
    const title = nl === -1 ? part.trim() : part.slice(0, nl).trim();
    const body = nl === -1 ? "" : part.slice(nl + 1).trim();
    return { title, body };
  });
}

export function natalReportFilename(name: string, birthDate: string): string {
  const n = sanitizeDownloadFilename(name || "未命名");
  const d = sanitizeDownloadFilename(birthDate);
  return sanitizeDownloadFilename(`${SITE_NAME}-本命分析-${n}-${d}.png`);
}

export function transitReportFilename(name: string, transitDate: string): string {
  const n = sanitizeDownloadFilename(name || "未命名");
  const d = sanitizeDownloadFilename(transitDate);
  return sanitizeDownloadFilename(`${SITE_NAME}-行運分析-${n}-${d}.png`);
}
