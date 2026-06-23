"use client";

import { useMemo } from "react";
import type { Planet, Aspect, House } from "@/lib/mock/natal";
import { planetGlyphs } from "@/lib/tokens/colors";
import { aspectColorByName, planetColorByName } from "@/lib/tokens/colors";
import {
  eclipticToChartRad,
  longitudeFromSignDegree,
  polarToXY,
} from "@/lib/utils/ecliptic";

interface NatalChartWheelProps {
  planets?: Planet[];
  aspects?: Aspect[];
  houses?: House[];
  hasBirthTime?: boolean;
  accent?: "natal" | "transit";
  size?: number;
}

const SIGN_LABELS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

function planetLon(p: Planet): number {
  if (p.longitude != null) return p.longitude % 360;
  return longitudeFromSignDegree(p.sign, p.degree);
}

function houseLon(h: House): number {
  if (h.longitude != null) return h.longitude % 360;
  return longitudeFromSignDegree(h.sign, h.degree);
}

function staggerRadius(baseR: number, index: number, total: number): number {
  if (total <= 1) return baseR;
  const step = 6;
  const mid = (total - 1) / 2;
  return baseR + (index - mid) * step;
}

export function NatalChartWheel({
  planets = [],
  aspects = [],
  houses = [],
  hasBirthTime = true,
  accent = "natal",
  size = 360,
}: NatalChartWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.72;
  const planetBaseR = outerR * 0.55;
  const accentColor = accent === "natal" ? "#c4b5fd" : "#fbbf24";

  const ascLon = useMemo(() => {
    const asc = planets.find((p) => p.name === "上升");
    if (asc) return planetLon(asc);
    if (houses.length > 0) return houseLon(houses[0]);
    return 0;
  }, [planets, houses]);

  const chartPlanets = useMemo(() => {
    const main = planets.filter((p) => p.name !== "上升" && p.name !== "中天");
    const withLon = main.map((p) => ({ ...p, lon: planetLon(p) }));
    withLon.sort((a, b) => a.lon - b.lon);

    const clusters: typeof withLon[] = [];
    for (const p of withLon) {
      const last = clusters[clusters.length - 1];
      if (last && Math.abs(p.lon - last[last.length - 1].lon) < 8) {
        last.push(p);
      } else {
        clusters.push([p]);
      }
    }

    const positioned: Array<typeof withLon[0] & { x: number; y: number }> = [];
    for (const cluster of clusters) {
      cluster.forEach((p, i) => {
        const rad = eclipticToChartRad(p.lon, ascLon);
        const r = staggerRadius(planetBaseR, i, cluster.length);
        const { x, y } = polarToXY(cx, cy, r, rad);
        positioned.push({ ...p, x, y });
      });
    }
    return positioned;
  }, [planets, ascLon, planetBaseR, cx, cy]);

  const houseLines = useMemo(() => {
    if (!hasBirthTime || !houses.length) return [];
    return houses.map((h) => {
      const rad = eclipticToChartRad(houseLon(h), ascLon);
      const inner = polarToXY(cx, cy, innerR, rad);
      const outer = polarToXY(cx, cy, outerR, rad);
      return { ...h, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
    });
  }, [houses, hasBirthTime, ascLon, innerR, outerR, cx, cy]);

  const aspectLines = useMemo(() => {
    const byName = new Map(chartPlanets.map((p) => [p.name, p]));
    return aspects
      .map((asp) => {
        const pa = byName.get(asp.planetA);
        const pb = byName.get(asp.planetB);
        if (!pa || !pb) return null;
        return { ...asp, x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y };
      })
      .filter(Boolean) as Array<Aspect & { x1: number; y1: number; x2: number; y2: number }>;
  }, [aspects, chartPlanets]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full"
      aria-label="星盤圖"
      role="img"
    >
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={accentColor} strokeWidth="1" opacity="0.4" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={accentColor} strokeWidth="0.5" opacity="0.25" />

      {!hasBirthTime &&
        Array.from({ length: 12 }).map((_, i) => {
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

      {houseLines.map((h) => (
        <line
          key={h.number}
          x1={h.x1}
          y1={h.y1}
          x2={h.x2}
          y2={h.y2}
          stroke={accentColor}
          strokeWidth="0.5"
          opacity="0.35"
        />
      ))}

      {SIGN_LABELS.map((sign, i) => {
        const lon = i * 30 + 15;
        const rad = eclipticToChartRad(lon, ascLon);
        const labelR = outerR - 14;
        const { x, y } = polarToXY(cx, cy, labelR, rad);
        return (
          <text
            key={sign}
            x={x}
            y={y}
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

      {aspectLines.map((asp) => (
        <line
          key={`${asp.planetA}-${asp.type}-${asp.planetB}`}
          x1={asp.x1}
          y1={asp.y1}
          x2={asp.x2}
          y2={asp.y2}
          stroke={aspectColorByName[asp.type] ?? accentColor}
          strokeWidth="1"
          opacity="0.45"
        />
      ))}

      {chartPlanets.map((p) => {
        const color = planetColorByName[p.name] ?? accentColor;
        return (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r="10" fill="rgba(5,4,11,0.85)" stroke={color} strokeWidth="0.6" />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize="9"
            >
              {planetGlyphs[p.name] ?? p.name[0]}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="4" fill={accentColor} opacity="0.3" />
    </svg>
  );
}
