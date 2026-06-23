"use client";

import { useMemo } from "react";
import type { Planet, House } from "@/lib/mock/natal";
import type { TransitAspect, TransitPlanet } from "@/lib/types/transit";
import { planetGlyphs } from "@/lib/tokens/colors";
import { aspectColorByName, planetColorByName } from "@/lib/tokens/colors";
import {
  eclipticToChartRad,
  longitudeFromSignDegree,
  polarToXY,
} from "@/lib/utils/ecliptic";

interface TransitChartWheelProps {
  natalPlanets?: Planet[];
  transitPlanets?: TransitPlanet[];
  houses?: House[];
  transitAspects?: TransitAspect[];
  hasBirthTime?: boolean;
  size?: number;
}

const SIGN_LABELS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

function planetLon(p: { sign: string; degree: string; longitude?: number }): number {
  if (p.longitude != null) return p.longitude % 360;
  return longitudeFromSignDegree(p.sign, p.degree);
}

function houseLon(h: House): number {
  if (h.longitude != null) return h.longitude % 360;
  return longitudeFromSignDegree(h.sign, h.degree);
}

function staggerRadius(baseR: number, index: number, total: number): number {
  if (total <= 1) return baseR;
  const step = 5;
  const mid = (total - 1) / 2;
  return baseR + (index - mid) * step;
}

type Positioned = { name: string; x: number; y: number; lon: number };

function positionRing(
  items: { name: string; sign: string; degree: string; longitude?: number }[],
  baseR: number,
  ascLon: number,
  cx: number,
  cy: number,
  excludeNames: string[] = [],
): Positioned[] {
  const filtered = items.filter((p) => !excludeNames.includes(p.name));
  const withLon = filtered.map((p) => ({ ...p, lon: planetLon(p) }));
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

  const positioned: Positioned[] = [];
  for (const cluster of clusters) {
    cluster.forEach((p, i) => {
      const rad = eclipticToChartRad(p.lon, ascLon);
      const r = staggerRadius(baseR, i, cluster.length);
      const { x, y } = polarToXY(cx, cy, r, rad);
      positioned.push({ name: p.name, x, y, lon: p.lon });
    });
  }
  return positioned;
}

export function TransitChartWheel({
  natalPlanets = [],
  transitPlanets = [],
  houses = [],
  transitAspects = [],
  hasBirthTime = true,
  size = 400,
}: TransitChartWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const midR = outerR * 0.68;
  const innerR = outerR * 0.42;
  const natalPlanetR = outerR * 0.52;
  const transitPlanetR = outerR * 0.86;

  const ascLon = useMemo(() => {
    const asc = natalPlanets.find((p) => p.name === "上升");
    if (asc) return planetLon(asc);
    if (houses.length > 0) return houseLon(houses[0]);
    return 0;
  }, [natalPlanets, houses]);

  const natalRing = useMemo(
    () => positionRing(natalPlanets, natalPlanetR, ascLon, cx, cy, []),
    [natalPlanets, natalPlanetR, ascLon, cx, cy],
  );

  const transitRing = useMemo(
    () => positionRing(transitPlanets, transitPlanetR, ascLon, cx, cy),
    [transitPlanets, transitPlanetR, ascLon, cx, cy],
  );

  const natalLookup = useMemo(() => {
    const map = new Map<string, Positioned>();
    for (const p of natalRing) map.set(p.name, p);
    const asc = natalPlanets.find((p) => p.name === "上升");
    const mc = natalPlanets.find((p) => p.name === "中天");
    for (const pt of [asc, mc]) {
      if (!pt || map.has(pt.name)) continue;
      const lon = planetLon(pt);
      const rad = eclipticToChartRad(lon, ascLon);
      const { x, y } = polarToXY(cx, cy, natalPlanetR, rad);
      map.set(pt.name, { name: pt.name, x, y, lon });
    }
    return map;
  }, [natalRing, natalPlanets, ascLon, cx, cy, natalPlanetR]);

  const transitLookup = useMemo(
    () => new Map(transitRing.map((p) => [p.name, p])),
    [transitRing],
  );

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
    return transitAspects
      .filter((a) => a.inPrimary !== false)
      .slice(0, 16)
      .map((asp) => {
        const tp = transitLookup.get(asp.transitPlanet);
        const np = natalLookup.get(asp.natalPlanet) ?? natalLookup.get(asp.natalPoint ?? "");
        if (!tp || !np) return null;
        return { ...asp, x1: tp.x, y1: tp.y, x2: np.x, y2: np.y };
      })
      .filter(Boolean) as Array<TransitAspect & { x1: number; y1: number; x2: number; y2: number }>;
  }, [transitAspects, transitLookup, natalLookup]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full h-full max-w-[420px] mx-auto"
      aria-label="行運雙盤圖"
      role="img"
    >
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.5" />
      <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.35" strokeDasharray="4 3" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#c4b5fd" strokeWidth="0.6" opacity="0.3" />

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
              stroke="#c4b5fd"
              strokeWidth="0.5"
              opacity="0.15"
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
          stroke="#c4b5fd"
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}

      {SIGN_LABELS.map((sign, i) => {
        const lon = i * 30 + 15;
        const rad = eclipticToChartRad(lon, ascLon);
        const labelR = outerR - 12;
        const { x, y } = polarToXY(cx, cy, labelR, rad);
        return (
          <text
            key={sign}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fbbf24"
            fontSize="10"
            opacity="0.65"
          >
            {sign}
          </text>
        );
      })}

      {aspectLines.map((asp) => (
        <line
          key={`${asp.transitPlanet}-${asp.type}-${asp.natalPlanet}`}
          x1={asp.x1}
          y1={asp.y1}
          x2={asp.x2}
          y2={asp.y2}
          stroke={aspectColorByName[asp.type] ?? "#fbbf24"}
          strokeWidth="1"
          opacity="0.4"
          strokeDasharray={asp.applying ? undefined : "3 2"}
        />
      ))}

      {natalRing
        .filter((p) => p.name !== "上升" && p.name !== "中天")
        .map((p) => {
          const color = planetColorByName[p.name] ?? "#c4b5fd";
          return (
            <g key={`natal-${p.name}`}>
              <circle cx={p.x} cy={p.y} r="9" fill="rgba(5,4,11,0.9)" stroke={color} strokeWidth="0.6" />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize="8"
              >
                {planetGlyphs[p.name] ?? p.name[0]}
              </text>
            </g>
          );
        })}

      {transitRing.map((p) => {
        const color = planetColorByName[p.name] ?? "#fbbf24";
        return (
          <g key={`transit-${p.name}`}>
            <circle cx={p.x} cy={p.y} r="10" fill="rgba(5,4,11,0.85)" stroke={color} strokeWidth="0.8" />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize="9"
              fontWeight="600"
            >
              {planetGlyphs[p.name] ?? p.name[0]}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="3" fill="#c4b5fd" opacity="0.35" />
    </svg>
  );
}
