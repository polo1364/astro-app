"use client";

import { planetGlyphs } from "@/lib/tokens/colors";
import type { Planet, Aspect } from "@/lib/mock/natal";

interface MockChartWheelProps {
  planets?: Planet[];
  aspects?: Aspect[];
  accent?: "natal" | "transit";
  size?: number;
}

const SIGN_LABELS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export function MockChartWheel({
  planets = [],
  aspects = [],
  accent = "natal",
  size = 360,
}: MockChartWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.72;
  const planetR = outerR * 0.55;

  const accentColor = accent === "natal" ? "#c4b5fd" : "#fbbf24";

  const planetPositions = planets.slice(0, 10).map((p, i) => {
    const angle = ((i / 10) * 360 - 90) * (Math.PI / 180);
    return {
      ...p,
      x: cx + planetR * Math.cos(angle),
      y: cy + planetR * Math.sin(angle),
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      aria-label="星盤圖"
      role="img"
    >
      {/* Outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke={accentColor}
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Inner ring */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill="none"
        stroke={accentColor}
        strokeWidth="0.5"
        opacity="0.25"
      />
      {/* House lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = ((i * 30 - 90) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={cx + innerR * Math.cos(angle)}
            y1={cy + innerR * Math.sin(angle)}
            x2={cx + outerR * Math.cos(angle)}
            y2={cy + outerR * Math.sin(angle)}
            stroke={accentColor}
            strokeWidth="0.5"
            opacity="0.2"
          />
        );
      })}
      {/* Zodiac signs */}
      {SIGN_LABELS.map((sign, i) => {
        const angle = ((i * 30 + 15 - 90) * Math.PI) / 180;
        const r = outerR - 14;
        return (
          <text
            key={sign}
            x={cx + r * Math.cos(angle)}
            y={cy + r * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={accentColor}
            fontSize="11"
            opacity="0.7"
          >
            {sign}
          </text>
        );
      })}
      {/* Aspect lines */}
      {aspects.slice(0, 6).map((asp, i) => {
        const pa = planetPositions.find((p) => p.name === asp.planetA);
        const pb = planetPositions.find((p) => p.name === asp.planetB);
        if (!pa || !pb) return null;
        const colors: Record<string, string> = {
          合相: "#fbbf24",
          對分: "#ef4444",
          三分: "#22c55e",
          四分: "#f97316",
          六分: "#38bdf8",
        };
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={colors[asp.type] ?? accentColor}
            strokeWidth="1"
            opacity="0.5"
          />
        );
      })}
      {/* Planets */}
      {planetPositions.map((p) => (
        <g key={p.name}>
          <circle cx={p.x} cy={p.y} r="10" fill="rgba(5,4,11,0.8)" stroke={accentColor} strokeWidth="0.5" />
          <text
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={accentColor}
            fontSize="9"
          >
            {planetGlyphs[p.name] ?? p.name[0]}
          </text>
        </g>
      ))}
      {/* Center */}
      <circle cx={cx} cy={cy} r="4" fill={accentColor} opacity="0.3" />
    </svg>
  );
}
