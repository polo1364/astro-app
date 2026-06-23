"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface MetaStripProps {
  items: { label: string; value: string }[];
  advancedItems?: { label: string; value: string }[];
  className?: string;
}

export function MetaStrip({ items, advancedItems = [], className }: MetaStripProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      className={cn(
        "rounded-md bg-white/5 border border-border text-caption",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-text-secondary font-medium">{item.label}</span>
            <span className="tabular-nums text-text-gold font-medium">{item.value}</span>
          </div>
        ))}
        {advancedItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-text-secondary hover:text-text-primary flex items-center gap-1 ml-auto"
          >
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            進階資訊
          </button>
        )}
        <Badge variant="muted" className={cn("text-label", advancedItems.length === 0 && "ml-auto")}>
          Swiss Ephemeris
        </Badge>
      </div>
      {showAdvanced && advancedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pb-3 pt-0 border-t border-border/50">
          {advancedItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-text-secondary font-medium">{item.label}</span>
              <span className="tabular-nums text-text-secondary text-label">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
