import { toPng } from "html-to-image";
import { colors } from "@/lib/tokens/colors";

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;
const SHARE_CARD_CONTENT_SELECTOR = "[data-share-card-content]";

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function resolveShareCardElement(element: HTMLElement): HTMLElement {
  return element.matches(SHARE_CARD_CONTENT_SELECTOR)
    ? element
    : (element.querySelector<HTMLElement>(SHARE_CARD_CONTENT_SELECTOR) ?? element);
}

export function sanitizeDownloadFilename(name: string): string {
  const cleaned = name.replace(INVALID_FILENAME_CHARS, "-").trim();
  return cleaned || "report";
}

export async function renderElementToPng(element: HTMLElement): Promise<Blob> {
  const target = resolveShareCardElement(element);
  await document.fonts.ready;
  await waitForNextPaint();

  const width = Math.max(target.scrollWidth, target.offsetWidth, 1);
  const height = Math.max(target.scrollHeight, target.offsetHeight, 1);

  const dataUrl = await toPng(target, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: colors.bg.base,
    width,
    height,
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error("圖片產生失敗");
  }
  return blob;
}

export function downloadImageBlob(blob: Blob, filename: string): void {
  const safeName = sanitizeDownloadFilename(filename);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName.endsWith(".png") ? safeName : `${safeName}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
