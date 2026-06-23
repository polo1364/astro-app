"use client";

import { useCallback, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { PersonalDailyResponse } from "@/lib/types/personalDailyHoroscope";
import {
  downloadShareImage,
  renderShareCardToPng,
  sharePersonalDailyImage,
  type SharePlatform,
} from "@/lib/utils/personalDailyShare";
import { PersonalDailyShareCard } from "@/components/daily/PersonalDailyShareCard";
import { cn } from "@/lib/utils";

interface PersonalDailyShareBarProps {
  result: PersonalDailyResponse;
  displayName: string;
  className?: string;
}

export function PersonalDailyShareBar({
  result,
  displayName,
  className,
}: PersonalDailyShareBarProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<SharePlatform | "download" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      const el = cardRef.current;
      if (!el) {
        setError("分享卡片尚未就緒，請稍後再試。");
        return;
      }
      setLoading(platform);
      setError(null);
      setStatus(null);
      try {
        const outcome = await sharePersonalDailyImage(el, {
          platform,
          displayName,
          date: result.date,
          sections: result.sections,
        });
        setStatus(outcome.message);
      } catch (e) {
        setError(e instanceof Error ? e.message : "分享失敗，請稍後再試。");
      } finally {
        setLoading(null);
      }
    },
    [displayName, result.date, result.sections],
  );

  const handleDownload = useCallback(async () => {
    const el = cardRef.current;
    if (!el || loading !== null) return;
    setLoading("download");
    setError(null);
    setStatus(null);
    try {
      const blob = await renderShareCardToPng(el);
      downloadShareImage(blob, result.date);
      setStatus("圖片已下載至本機。");
    } catch {
      setError("圖片產生失敗，請稍後再試");
    } finally {
      setLoading(null);
    }
  }, [loading, result.date]);

  return (
    <>
      <PersonalDailyShareCard
        ref={cardRef}
        displayName={displayName}
        date={result.date}
        sections={result.sections}
      />

      <div className={cn("space-y-2", className)}>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={handleDownload}
            aria-label="下載至本機，不會上傳"
            title="下載至本機，不會上傳"
          >
            {loading === "download" ? <Spinner className="size-3.5" /> : <Download className="size-3.5" />}
            下載圖片
          </Button>
          <span className="text-caption text-text-muted mx-1">分享至</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={() => handleShare("facebook")}
            className="border-[#1877F2]/40 text-[#6BA3FF] hover:border-[#1877F2]/60"
          >
            {loading === "facebook" ? (
              <Spinner className="size-3.5" />
            ) : null}
            Facebook
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={() => handleShare("instagram")}
            className="border-[#E4405F]/40 text-[#F472B6] hover:border-[#E4405F]/60"
          >
            {loading === "instagram" ? (
              <Spinner className="size-3.5" />
            ) : null}
            Instagram
          </Button>
        </div>
        {status && <p className="text-caption text-status-ok">{status}</p>}
        {error && <p className="text-caption text-status-blocked">{error}</p>}
      </div>
    </>
  );
}
