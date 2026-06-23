"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ZodiacSign } from "@/lib/data/zodiacSigns";
import { getSignById } from "@/lib/data/zodiacSigns";
import { ZodiacWheelPointer } from "@/components/daily/ZodiacWheelPointer";
import { ZodiacWheelCenter } from "@/components/daily/ZodiacWheelCenter";
import { ZodiacWheelInteraction } from "@/components/daily/ZodiacWheelInteraction";
import type { DailyHoroscopeEntry } from "@/lib/types/dailyHoroscope";

import { useMounted } from "@/lib/hooks/useMounted";

interface ZodiacDailyWheelProps {
  pointerSign: ZodiacSign;
  rotationDeg: number;
  reduceMotion: boolean;
  onSelectSign: (signId: string) => void;
  pointerHoroscope?: DailyHoroscopeEntry | null;
  horoscopeLoading?: boolean;
  className?: string;
}

export function ZodiacDailyWheel({
  pointerSign,
  rotationDeg,
  reduceMotion,
  onSelectSign,
  pointerHoroscope = null,
  horoscopeLoading = false,
  className,
}: ZodiacDailyWheelProps) {
  const mounted = useMounted();
  const [hoverInfo, setHoverInfo] = useState<{
    signId: string;
    clientX: number;
    clientY: number;
  } | null>(null);
  const hoveredSign = hoverInfo ? getSignById(hoverInfo.signId) : null;
  const spinDeg = reduceMotion ? 0 : rotationDeg;

  return (
    <div
      className={cn(
        "relative w-full max-w-[min(100%,520px)] sm:max-w-[min(100%,580px)] lg:max-w-[min(100%,640px)] aspect-square mx-auto",
        className
      )}
      role="img"
      aria-label="黃道十二宮輪盤"
    >
      <ZodiacWheelPointer />

      {mounted &&
        hoveredSign &&
        hoverInfo &&
        createPortal(
          <div
            className="fixed z-[100] pointer-events-none glass-strong rounded-lg px-3 py-2 border border-[var(--color-accent-daily)]/40 shadow-lg"
            style={{ left: hoverInfo.clientX + 14, top: hoverInfo.clientY + 14 }}
            role="status"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm" aria-hidden>
                {hoveredSign.symbol}
              </span>
              <span className="text-sm font-medium text-text-primary whitespace-nowrap">
                {hoveredSign.nameZh}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 tabular-nums whitespace-nowrap">
              {hoveredSign.dateRange}
            </p>
          </div>,
          document.body
        )}

      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className="relative w-full h-full origin-center"
          style={reduceMotion ? undefined : { transform: `rotate(${spinDeg}deg)` }}
        >
          <Image
            src="/daily/roulette.png"
            alt=""
            fill
            priority
            className="object-contain select-none pointer-events-none"
            sizes="(max-width: 640px) 100vw, 640px"
            draggable={false}
          />
        </div>

        {/* 互動層固定於螢幕座標，計算時帶入 rotationDeg */}
        <ZodiacWheelInteraction
          rotationDeg={spinDeg}
          hoveredSignId={hoverInfo?.signId ?? null}
          onHover={setHoverInfo}
          onSelect={onSelectSign}
        />
      </div>

      <ZodiacWheelCenter
        sign={pointerSign}
        horoscope={pointerHoroscope}
        loading={horoscopeLoading}
      />
    </div>
  );
}
