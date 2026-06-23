"use client";

import { useEffect } from "react";
import {
  useChartHistoryContext,
  type ChartHistoryPageHandlers,
} from "@/lib/context/ChartHistoryContext";
import type { ChartHistoryRecord, ChartKind } from "@/lib/storage/chartHistoryTypes";

export function useRegisterChartHistoryPage(
  kind: ChartKind,
  activeId: string | null,
  onLoad: (entry: ChartHistoryRecord) => void,
) {
  const { registerPage } = useChartHistoryContext();

  useEffect(() => {
    const handlers: ChartHistoryPageHandlers = { kind, activeId, onLoad };
    registerPage(handlers);
    return () => registerPage(null);
  }, [kind, activeId, onLoad, registerPage]);
}
