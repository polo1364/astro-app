"use client";

import { useMemo, useState } from "react";
import type { TransitAspect } from "@/lib/types/transit";
import { Badge } from "@/components/ui/Badge";
import { PlainHint } from "@/components/ui/PlainHint";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { plainTransitAspectLine } from "@/lib/data/plainLanguage";
import {
  filterTransitAspects,
  sortTransitAspects,
  TRANSIT_ASPECT_TYPE_OPTIONS,
  type TransitPriorityFilter,
  type TransitStrengthFilter,
} from "@/lib/utils/transitAspects";
import { aspectColorByName, planetColorByName } from "@/lib/tokens/colors";
import { cn } from "@/lib/utils";

const strengthVariant = {
  強: "transit" as const,
  中: "natal" as const,
  弱: "muted" as const,
};

const GRID_COLS = "80px 64px 80px 72px 56px 48px 40px";

interface TransitAspectTableProps {
  aspects: TransitAspect[];
  appendix?: TransitAspect[];
  hideHouse?: boolean;
}

export function TransitAspectTable({ aspects, appendix = [], hideHouse = false }: TransitAspectTableProps) {
  const [priorityFilter, setPriorityFilter] = useState<TransitPriorityFilter>("primary");
  const [strengthFilter, setStrengthFilter] = useState<TransitStrengthFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showAppendix, setShowAppendix] = useState(false);

  const displayed = useMemo(
    () =>
      sortTransitAspects(
        filterTransitAspects(aspects, priorityFilter, strengthFilter, typeFilter),
      ),
    [aspects, priorityFilter, strengthFilter, typeFilter],
  );

  const appendixDisplayed = useMemo(
    () => (showAppendix ? sortTransitAspects(appendix) : []),
    [appendix, showAppendix],
  );

  function renderRow(a: TransitAspect, key: string) {
    const natalName = a.natalPlanet || a.natalPoint || "";
    const house = hideHouse ? null : (a as TransitAspect & { natalHouse?: number }).natalHouse;
    return (
      <div key={key} className="data-row-stack px-4 py-3 space-y-2">
        <div
          className="grid items-center gap-x-3 text-body"
          style={{ gridTemplateColumns: GRID_COLS }}
        >
          <AstroTerm
            term={a.transitPlanet}
            className="font-semibold"
            style={{ color: planetColorByName[a.transitPlanet] }}
          >
            {a.transitPlanet}
          </AstroTerm>
          <AstroTerm
            term={a.type}
            className="font-semibold"
            style={{ color: aspectColorByName[a.type] }}
          >
            {a.type}
          </AstroTerm>
          <AstroTerm
            term={natalName}
            className="font-medium"
            style={{ color: planetColorByName[natalName] }}
          >
            {natalName}
          </AstroTerm>
          <span className="tabular-nums text-text-gold">{a.orb}</span>
          <span>
            <Badge variant={strengthVariant[a.strength]}>{a.strength}</Badge>
          </span>
          <span
            className={cn(
              "text-caption font-medium",
              a.applying ? "text-status-ok" : "text-text-secondary",
            )}
          >
            {a.applying ? "入" : "出"}
          </span>
          <span className="text-caption text-text-secondary">
            {a.priority === "high" ? "高" : a.priority === "low" ? "低" : "中"}
          </span>
        </div>
        <PlainHint>
          {plainTransitAspectLine(
            a.transitPlanet,
            natalName,
            a.type,
            a.strength,
            a.applying,
            house,
          )}
        </PlainHint>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border">
        <span className="text-caption text-text-secondary mr-1">篩選</span>
        {(["all", "primary", "high"] as TransitPriorityFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setPriorityFilter(f)}
            className={cn(
              "text-caption px-2 py-0.5 rounded border transition-colors",
              priorityFilter === f
                ? "border-accent-transit/50 bg-accent-transit/10 text-text-primary"
                : "border-border text-text-secondary hover:text-text-primary",
            )}
          >
            {f === "all" ? "全部" : f === "primary" ? "主報告" : "高優先"}
          </button>
        ))}
        <span className="text-border mx-1">|</span>
        {(["all", "強", "中", "弱"] as TransitStrengthFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStrengthFilter(f)}
            className={cn(
              "text-caption px-2 py-0.5 rounded border transition-colors",
              strengthFilter === f
                ? "border-accent-transit/50 bg-accent-transit/10 text-text-primary"
                : "border-border text-text-secondary hover:text-text-primary",
            )}
          >
            {f === "all" ? "各強度" : f}
          </button>
        ))}
        <span className="text-border mx-1">|</span>
        <button
          type="button"
          onClick={() => setTypeFilter(null)}
          className={cn(
            "text-caption px-2 py-0.5 rounded border transition-colors",
            typeFilter === null
              ? "border-accent-transit/50 bg-accent-transit/10"
              : "border-border text-text-secondary hover:text-text-primary",
          )}
        >
          各相位
        </button>
        {TRANSIT_ASPECT_TYPE_OPTIONS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={cn(
              "text-caption px-2 py-0.5 rounded border transition-colors",
              typeFilter === t
                ? "border-accent-transit/50 bg-accent-transit/10"
                : "border-border text-text-secondary hover:text-text-primary",
            )}
            style={typeFilter === t ? { color: aspectColorByName[t] } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="data-row-header" style={{ gridTemplateColumns: GRID_COLS }}>
        <span className="text-accent-transit">行運</span>
        <span><AstroTerm term="相位">相位</AstroTerm></span>
        <span className="text-accent-natal">本命</span>
        <span><AstroTerm term="容許">容許</AstroTerm></span>
        <span><AstroTerm term="強度">強度</AstroTerm></span>
        <span><AstroTerm term="入相">入相</AstroTerm></span>
        <span><AstroTerm term="優先級">優先</AstroTerm></span>
      </div>

      {displayed.length === 0 ? (
        <p className="text-body text-text-secondary px-4 py-5">沒有符合條件的主報告相位。</p>
      ) : (
        displayed.map((a) =>
          renderRow(a, `${a.transitPlanet}-${a.type}-${a.natalPlanet}`),
        )
      )}

      {appendix.length > 0 && (
        <div className="border-t border-border mt-2">
          <button
            type="button"
            onClick={() => setShowAppendix((v) => !v)}
            className="w-full text-left text-caption text-text-secondary px-4 py-2.5 hover:text-text-primary"
          >
            {showAppendix ? "收起" : "展開"}附錄相位（{appendix.length}）
          </button>
          {showAppendix && appendixDisplayed.map((a) =>
            renderRow(a, `app-${a.transitPlanet}-${a.type}-${a.natalPlanet}`),
          )}
        </div>
      )}
    </div>
  );
}
