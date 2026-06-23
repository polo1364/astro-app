"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { getSignById } from "@/lib/data/zodiacSigns";
import { signElementBorderColor } from "@/lib/utils/signElementColor";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { DailyBatchStatus, DailyHoroscopeEntry } from "@/lib/types/dailyHoroscope";
import { DAILY_SECTION_ORDER } from "@/lib/types/dailyHoroscope";
import { DailyHoroscopeSection } from "@/components/daily/DailyHoroscopeSection";
import { formatTaipeiDisplayDate } from "@/lib/utils/taipeiDate";

const ELEMENT_ZH: Record<string, string> = {
  fire: "火象",
  earth: "土象",
  air: "風象",
  water: "水象",
};

interface SignHoroscopeModalProps {
  signId: string | null;
  horoscope: DailyHoroscopeEntry | null;
  batchDate?: string;
  batchStatus?: DailyBatchStatus;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

export function SignHoroscopeModal({
  signId,
  horoscope,
  batchDate,
  batchStatus,
  loading = false,
  error,
  onClose,
}: SignHoroscopeModalProps) {
  const sign = signId ? getSignById(signId) : undefined;
  const open = Boolean(signId && sign);

  const showLoading = loading || (batchStatus === "pending" && !horoscope);
  const showEmpty = !showLoading && !horoscope;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      {open && sign && (
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 glass-strong rounded-lg p-6 shadow-2xl focus:outline-none max-h-[85vh] flex flex-col"
            style={{ borderColor: signElementBorderColor(sign.element), borderWidth: 1 }}
            aria-describedby="horoscope-desc"
          >
            <div className="flex items-start justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  {sign.symbol}
                </span>
                <div>
                  <Dialog.Title
                    className="text-lg font-semibold text-text-primary"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {sign.nameZh}今日運勢
                  </Dialog.Title>
                  <p className="text-caption text-text-muted">
                    {batchDate ? formatTaipeiDisplayDate(batchDate) : sign.dateRange}
                    {batchDate && " · 台北"}
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  className="text-text-muted hover:text-text-primary transition-colors p-1 rounded"
                  aria-label="關閉"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Badge variant="muted">{ELEMENT_ZH[sign.element]}</Badge>
              <Badge variant="muted">今日運勢</Badge>
              {batchStatus === "ready" && horoscope && (
                <Badge variant="natal" className="text-label">
                  已更新
                </Badge>
              )}
              {batchStatus === "pending" && (
                <Badge variant="muted" className="text-label">
                  生成中
                </Badge>
              )}
            </div>

            <div id="horoscope-desc" className="overflow-y-auto min-h-0 space-y-3 pr-1">
              {showLoading && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Spinner />
                  <p className="text-caption text-text-muted">今日運勢載入中…</p>
                </div>
              )}

              {showEmpty && (
                <div className="py-8 text-center space-y-2">
                  <p className="text-body text-text-secondary">
                    {error ?? "今日運勢尚無資料，請稍後再試。"}
                  </p>
                  {batchStatus === "failed" && (
                    <p className="text-caption text-text-muted">
                      後端生成失敗，可聯繫管理員或稍後重新整理。
                    </p>
                  )}
                </div>
              )}

              {horoscope &&
                DAILY_SECTION_ORDER.map((key) => {
                  const section = horoscope.sections.find((s) => s.key === key);
                  if (!section) return null;
                  if (key === "theme") {
                    return (
                      <DailyHoroscopeSection
                        key={key}
                        sectionKey={key}
                        body={section.body}
                      />
                    );
                  }
                  if (key === "evidence") {
                    return (
                      <div key={key} className="pt-3 border-t border-border">
                        <DailyHoroscopeSection
                          sectionKey={key}
                          body={section.body}
                          compact
                        />
                      </div>
                    );
                  }
                  return (
                    <DailyHoroscopeSection
                      key={key}
                      sectionKey={key}
                      body={section.body}
                    />
                  );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-border shrink-0">
              <Button variant="secondary" className="w-full" onClick={onClose}>
                關閉
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
