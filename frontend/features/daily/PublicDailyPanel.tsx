"use client";

import { ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClientIcon } from "@/components/ui/ClientIcon";
import { Spinner } from "@/components/ui/Spinner";
import { ZodiacDailyWheel } from "@/components/daily/ZodiacDailyWheel";
import { SignHoroscopeModal } from "@/components/daily/SignHoroscopeModal";
import { DailySkyStrip } from "@/components/daily/DailySkyStrip";
import { useZodiacWheelSpin } from "@/lib/hooks/useZodiacWheelSpin";
import { useDailyHoroscope } from "@/lib/hooks/useDailyHoroscope";
import { ZODIAC_SIGNS } from "@/lib/data/zodiacSigns";
import { signElementBorderColor } from "@/lib/utils/signElementColor";
import { formatTaipeiDisplayDate } from "@/lib/utils/taipeiDate";

interface PublicDailyPanelProps {
  onEnterPersonal: () => void;
}

export function PublicDailyPanel({ onEnterPersonal }: PublicDailyPanelProps) {
  const {
    mounted,
    rotationDeg,
    pointerSign,
    reduceMotion,
    modalSignId,
    openModal,
    closeModal,
    setPointerIndex,
  } = useZodiacWheelSpin();

  const { batch, loading, error, getHoroscope } = useDailyHoroscope();

  const pointerHoroscope = getHoroscope(pointerSign.id);
  const displayDate = batch?.date
    ? formatTaipeiDisplayDate(batch.date)
    : null;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8">
      <header className="text-center space-y-2">
        <p className="text-sm text-text-secondary uppercase tracking-widest">
          每日運勢 · 大眾版
        </p>
        <h1
          className="text-3xl sm:text-4xl font-semibold text-text-primary tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          今日星座運勢
        </h1>
        {displayDate && (
          <p className="text-sm sm:text-body text-text-secondary">{displayDate}</p>
        )}
        {batch?.status === "pending" && (
          <p className="text-sm text-accent-transit">今日運勢生成中…</p>
        )}
        <DailySkyStrip summary={batch?.sky_summary ?? null} className="mt-1" />
      </header>

      {error && (
        <p className="text-sm text-accent-transit text-center max-w-md leading-relaxed">{error}</p>
      )}

      {loading && !batch ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Spinner />
          <p className="text-sm text-text-secondary">載入今日運勢…</p>
        </div>
      ) : (
        <ZodiacDailyWheel
          rotationDeg={mounted ? rotationDeg : 0}
          pointerSign={pointerSign}
          reduceMotion={reduceMotion || !mounted}
          onSelectSign={openModal}
          pointerHoroscope={pointerHoroscope}
          horoscopeLoading={loading || batch?.status === "pending"}
        />
      )}

      {reduceMotion && (
        <div className="w-full">
          <p className="text-sm text-text-secondary text-center mb-3">
            已啟用減少動態效果，請點選星座查看運勢
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ZODIAC_SIGNS.map((sign, i) => (
              <Button
                key={sign.id}
                variant="secondary"
                size="sm"
                className="text-xs border-l-2"
                style={{ borderLeftColor: signElementBorderColor(sign.element) }}
                onClick={() => {
                  setPointerIndex(i);
                  openModal(sign.id);
                }}
              >
                <span aria-hidden>{sign.symbol}</span>
                {sign.nameZh.replace("座", "")}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center w-full max-w-sm">
        <Button size="lg" className="w-full" onClick={onEnterPersonal}>
          <ClientIcon icon={User} className="size-4" />
          進入個人版運勢
          <ClientIcon icon={ArrowRight} className="size-4" />
        </Button>
        <p className="text-sm text-text-secondary mt-2">
          需填寫出生資料 · 可載入已儲存基本資料
        </p>
      </div>

      {pointerHoroscope && (
        <p className="text-sm sm:text-body text-text-secondary text-center max-w-md leading-relaxed px-2">
          <span className="font-semibold text-text-primary">{pointerSign.nameZh}</span>
          {" — "}
          {pointerHoroscope.summary}
          {pointerHoroscope.summary.length >= 24 ? "…" : ""}
        </p>
      )}

      <SignHoroscopeModal
        signId={modalSignId}
        horoscope={modalSignId ? getHoroscope(modalSignId) : null}
        batchDate={batch?.date}
        batchStatus={batch?.status}
        loading={loading}
        error={error}
        onClose={closeModal}
      />
    </div>
  );
}
