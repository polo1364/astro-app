"use client";

import { useEffect } from "react";

interface UseSimulatedProgressOptions {
  /** 預估完成時間，進度會在此區間內趨近 maxPercent */
  estimatedMs?: number;
  /** 請求完成前進度上限，避免提早到 100% */
  maxPercent?: number;
}

export function useSimulatedProgress(
  active: boolean,
  setProgress: (value: number) => void,
  { estimatedMs = 55_000, maxPercent = 92 }: UseSimulatedProgressOptions = {},
) {
  useEffect(() => {
    if (!active) return;

    setProgress(4);
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / estimatedMs, 1);
      const eased = 1 - (1 - t) ** 2;
      setProgress(4 + (maxPercent - 4) * eased);
    }, 150);

    return () => window.clearInterval(id);
  }, [active, estimatedMs, maxPercent, setProgress]);
}

export async function finishSimulatedProgress(
  setProgress: (value: number) => void,
  delayMs = 350,
): Promise<void> {
  setProgress(100);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
