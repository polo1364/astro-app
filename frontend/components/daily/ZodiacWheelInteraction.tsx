"use client";

import type { MouseEvent } from "react";
import { ZODIAC_SIGNS } from "@/lib/data/zodiacSigns";
import { signIndexFromPoint, highlightSectorBounds } from "@/lib/utils/zodiacWheelMath";

export interface WheelHoverInfo {
  signId: string;
  clientX: number;
  clientY: number;
}

interface ZodiacWheelInteractionProps {
  rotationDeg: number;
  hoveredSignId: string | null;
  onHover: (info: WheelHoverInfo | null) => void;
  onSelect: (signId: string) => void;
}

function highlightPath(index: number): string {
  const { startDeg, endDeg } = highlightSectorBounds(index);
  const pt = (deg: number, radius: number) => {
    const radian = ((deg - 90) * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(radian),
      y: 50 + radius * Math.sin(radian),
    };
  };
  const o1 = pt(startDeg, 50);
  const o2 = pt(endDeg, 50);
  const i2 = pt(endDeg, 21);
  const i1 = pt(startDeg, 21);
  return `M ${o1.x} ${o1.y} A 50 50 0 0 1 ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A 21 21 0 0 0 ${i1.x} ${i1.y} Z`;
}

export function ZodiacWheelInteraction({
  rotationDeg,
  hoveredSignId,
  onHover,
  onSelect,
}: ZodiacWheelInteractionProps) {
  const hoveredIndex = hoveredSignId
    ? ZODIAC_SIGNS.findIndex((s) => s.id === hoveredSignId)
    : -1;

  function pickSign(e: MouseEvent<HTMLDivElement>, onPick: (info: WheelHoverInfo | null) => void) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const index = signIndexFromPoint(
      e.clientX - cx,
      e.clientY - cy,
      rect.width,
      rotationDeg
    );
    if (index === null) {
      onPick(null);
      return;
    }
    onPick({
      signId: ZODIAC_SIGNS[index].id,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  }

  return (
    <div
      className="absolute inset-0 z-40 cursor-pointer"
      onMouseMove={(e) => pickSign(e, onHover)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const index = signIndexFromPoint(
          e.clientX - cx,
          e.clientY - cy,
          rect.width,
          rotationDeg
        );
        if (index !== null) onSelect(ZODIAC_SIGNS[index].id);
      }}
    >
      {hoveredIndex >= 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
          <path
            d={highlightPath(hoveredIndex)}
            fill="rgba(232, 213, 163, 0.22)"
          />
        </svg>
      )}
    </div>
  );
}
