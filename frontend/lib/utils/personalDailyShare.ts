import { toPng } from "html-to-image";
import { uploadPersonalShareImage } from "@/lib/api";
import type { PersonalDailySectionKey, PersonalDailySections } from "@/lib/types/personalDailyHoroscope";
import { formatTaipeiDisplayDate } from "@/lib/utils/taipeiDate";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "星象觀測台";

export const COMPACT_SHARE_SECTIONS: PersonalDailySectionKey[] = [
  "theme",
  "work",
  "love",
  "money",
  "health",
  "advice",
];

export function buildShareCaption(
  displayName: string,
  date: string,
  sections: PersonalDailySections,
): string {
  const name = displayName || "你";
  const dateLabel = formatTaipeiDisplayDate(date);
  const theme = sections.theme?.trim() ?? "";
  const advice = sections.advice?.trim() ?? "";
  const lines = [
    `${SITE_NAME} · ${name} 的個人今日運勢（${dateLabel}）`,
    theme,
    advice ? `今日提醒：${advice}` : "",
    `${SITE_NAME} · 個人化每日行運`,
  ].filter(Boolean);
  return lines.join("\n\n");
}

export function shareImageFilename(date: string): string {
  return `${SITE_NAME}-個人運勢-${date}.png`;
}

export async function renderShareCardToPng(element: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    skipAutoScale: true,
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error("分享圖片產生失敗");
  }
  return blob;
}

export function downloadShareImage(blob: Blob, date: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = shareImageFilename(date);
  a.click();
  URL.revokeObjectURL(url);
}

function blobToShareFile(blob: Blob, date: string): File {
  return new File([blob], shareImageFilename(date), { type: "image/png" });
}

export function canShareImageFile(blob: Blob, date: string): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [blobToShareFile(blob, date)] });
  } catch {
    return false;
  }
}

export async function shareImageNative(
  blob: Blob,
  caption: string,
  date: string,
): Promise<boolean> {
  if (!canShareImageFile(blob, date)) return false;
  const file = blobToShareFile(blob, date);
  await navigator.share({
    files: [file],
    text: caption,
    title: `${SITE_NAME} 個人今日運勢`,
  });
  return true;
}

export type SharePlatform = "facebook" | "instagram";

export const SHARE_FALLBACK_HINT: Record<SharePlatform, string> = {
  facebook: "已開啟 Facebook 分享頁，運勢圖片預覽已載入。",
  instagram: "圖片已下載，請在 Instagram 建立新貼文並選擇此圖片。",
};

/** 開啟 Facebook 官方分享對話框（帶 OG 預覽連結） */
export function openFacebookShare(sharePageUrl: string): void {
  const params = new URLSearchParams({ u: sharePageUrl });
  const url = `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  window.open(url, "facebook-share", "noopener,noreferrer,width=680,height=520");
}

export function openInstagramShare(): void {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = "instagram://camera";
    window.setTimeout(() => {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }, 600);
    return;
  }
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
}

async function uploadForFacebookPreview(
  blob: Blob,
  date: string,
  caption: string,
): Promise<string> {
  const title = `${SITE_NAME} · 個人今日運勢`;
  const { sharePageUrl } = await uploadPersonalShareImage(
    blob,
    shareImageFilename(date),
    title,
    caption,
  );
  return sharePageUrl;
}

export async function sharePersonalDailyImage(
  element: HTMLElement,
  options: {
    platform: SharePlatform;
    displayName: string;
    date: string;
    sections: PersonalDailySections;
  },
): Promise<{ mode: "native" | "download" | "facebook"; message: string }> {
  const blob = await renderShareCardToPng(element);
  const caption = buildShareCaption(options.displayName, options.date, options.sections);

  if (options.platform === "facebook") {
    const sharePageUrl = await uploadForFacebookPreview(blob, options.date, caption);
    openFacebookShare(sharePageUrl);
    return { mode: "facebook", message: SHARE_FALLBACK_HINT.facebook };
  }

  if (canShareImageFile(blob, options.date)) {
    await shareImageNative(blob, caption, options.date);
    return { mode: "native", message: "已開啟系統分享，請選擇 Instagram。" };
  }

  downloadShareImage(blob, options.date);
  openInstagramShare();
  return { mode: "download", message: SHARE_FALLBACK_HINT.instagram };
}
