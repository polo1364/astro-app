"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { CHART_TAB_GUIDES, type ChartTabGuideKey } from "@/lib/data/chartTabGuides";
import { useMounted } from "@/lib/hooks/useMounted";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "natal-guide-dismissed";

interface ChartTabGuideProps {
  guideKey: ChartTabGuideKey;
  className?: string;
}

function loadDismissed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function ChartTabGuide({ guideKey, className }: ChartTabGuideProps) {
  const guide = CHART_TAB_GUIDES[guideKey];
  const mounted = useMounted();
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const prefs = loadDismissed();
    if (prefs[guideKey]) {
      setDismissed(true);
      setOpen(false);
    }
  }, [guideKey, mounted]);

  function handleDismiss() {
    setDismissed(true);
    setOpen(false);
    const prefs = loadDismissed();
    prefs[guideKey] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  const showCollapsed = mounted && dismissed && !open;

  if (showCollapsed) {
    return (
      <div className={cn("mx-4 mt-3 mb-1 flex items-center justify-between gap-2", className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-caption text-text-secondary hover:text-text-primary flex items-center gap-1"
        >
          <ChevronDown className="size-4" />
          {guide.title}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-4 mt-4 mb-2 rounded-md border border-border-subtle bg-white/8 px-4 py-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-caption font-medium text-text-primary flex items-center gap-1 text-left"
        >
          {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
          {guide.title}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-text-secondary hover:text-text-primary shrink-0 p-0.5"
          aria-label="不再顯示此說明"
        >
          <X className="size-4" />
        </button>
      </div>
      {open && (
        <p className="text-caption text-text-secondary leading-relaxed">{guide.body}</p>
      )}
    </div>
  );
}
