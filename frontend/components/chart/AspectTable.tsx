"use client";

import { useMemo, useState } from "react";
import type { Aspect } from "@/lib/mock/natal";
import { Badge } from "@/components/ui/Badge";
import { PlainHint } from "@/components/ui/PlainHint";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { plainAspectLine } from "@/lib/data/plainLanguage";
import {
  ASPECT_TYPE_OPTIONS,
  filterAspects,
  sortAspects,
  type AspectStrengthFilter,
} from "@/lib/utils/aspects";
import { aspectColorByName, planetColorByName } from "@/lib/tokens/colors";
import { cn } from "@/lib/utils";

const strengthVariant = {
  強: "natal" as const,
  中: "transit" as const,
  弱: "muted" as const,
};

const GRID_COLS = "80px 64px 80px 72px 56px";

interface AspectTableProps {
  aspects: Aspect[];
}

export function AspectTable({ aspects }: AspectTableProps) {
  const [strengthFilter, setStrengthFilter] = useState<AspectStrengthFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const displayed = useMemo(
    () => sortAspects(filterAspects(aspects, strengthFilter, typeFilter)),
    [aspects, strengthFilter, typeFilter],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border">
        <span className="text-caption text-text-muted mr-1">篩選</span>
        <button
          type="button"
          onClick={() => setStrengthFilter("all")}
          className={cn(
            "text-caption px-2 py-0.5 rounded border transition-colors",
            strengthFilter === "all"
              ? "border-accent-natal/50 bg-accent-natal/10 text-text-primary"
              : "border-border text-text-muted hover:text-text-secondary",
          )}
        >
          全部
        </button>
        <button
          type="button"
          onClick={() => setStrengthFilter("strong-medium")}
          className={cn(
            "text-caption px-2 py-0.5 rounded border transition-colors",
            strengthFilter === "strong-medium"
              ? "border-accent-natal/50 bg-accent-natal/10 text-text-primary"
              : "border-border text-text-muted hover:text-text-secondary",
          )}
        >
          強與中
        </button>
        <span className="text-border mx-1">|</span>
        <button
          type="button"
          onClick={() => setTypeFilter(null)}
          className={cn(
            "text-caption px-2 py-0.5 rounded border transition-colors",
            typeFilter === null
              ? "border-accent-natal/50 bg-accent-natal/10 text-text-primary"
              : "border-border text-text-muted hover:text-text-secondary",
          )}
        >
          各相位
        </button>
        {ASPECT_TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={cn(
              "text-caption px-2 py-0.5 rounded border transition-colors",
              typeFilter === t
                ? "border-accent-natal/50 bg-accent-natal/10"
                : "border-border text-text-muted hover:text-text-secondary",
            )}
            style={typeFilter === t ? { color: aspectColorByName[t] } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="data-row-header" style={{ gridTemplateColumns: GRID_COLS }}>
        <span>行星</span>
        <span><AstroTerm term="相位">相位</AstroTerm></span>
        <span>行星</span>
        <span><AstroTerm term="容許">容許</AstroTerm></span>
        <span><AstroTerm term="強度">強度</AstroTerm></span>
      </div>

      {displayed.length === 0 ? (
        <p className="text-body text-text-muted px-4 py-5">沒有符合條件的相位。</p>
      ) : (
        displayed.map((a) => (
          <div key={`${a.planetA}-${a.type}-${a.planetB}`} className="data-row-stack px-4 py-3 space-y-2">
            <div
              className="grid items-center gap-x-3 text-body"
              style={{ gridTemplateColumns: GRID_COLS }}
            >
              <AstroTerm
                term={a.planetA}
                className="font-medium"
                style={{ color: planetColorByName[a.planetA] }}
              >
                {a.planetA}
              </AstroTerm>
              <AstroTerm
                term={a.type}
                className="text-caption font-semibold"
                style={{ color: aspectColorByName[a.type] }}
              >
                {a.type}
              </AstroTerm>
              <AstroTerm
                term={a.planetB}
                className="font-medium"
                style={{ color: planetColorByName[a.planetB] }}
              >
                {a.planetB}
              </AstroTerm>
              <span className="text-caption text-text-muted tabular-nums">{a.orb}</span>
              <Badge variant={strengthVariant[a.strength]}>{a.strength}</Badge>
            </div>
            <PlainHint>
              {plainAspectLine(a.planetA, a.planetB, a.type, a.strength)}
            </PlainHint>
          </div>
        ))
      )}
    </div>
  );
}
