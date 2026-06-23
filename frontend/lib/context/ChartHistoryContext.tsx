"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChartHistoryRecord, ChartKind } from "@/lib/storage/chartHistoryTypes";

export interface ChartHistoryPageHandlers {
  kind: ChartKind;
  activeId: string | null;
  onLoad: (entry: ChartHistoryRecord) => void;
}

interface ChartHistoryContextValue {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  refreshToken: number;
  notifySaved: (kind: ChartKind, id: string) => void;
  pageHandlers: ChartHistoryPageHandlers | null;
  registerPage: (handlers: ChartHistoryPageHandlers | null) => void;
}

const ChartHistoryContext = createContext<ChartHistoryContextValue | null>(null);

export function ChartHistoryProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pageHandlers, setPageHandlers] = useState<ChartHistoryPageHandlers | null>(null);

  const registerPage = useCallback((handlers: ChartHistoryPageHandlers | null) => {
    setPageHandlers(handlers);
  }, []);

  const notifySaved = useCallback((_kind: ChartKind, _id: string) => {
    setRefreshToken((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      modalOpen,
      setModalOpen,
      refreshToken,
      notifySaved,
      pageHandlers,
      registerPage,
    }),
    [modalOpen, refreshToken, notifySaved, pageHandlers, registerPage],
  );

  return (
    <ChartHistoryContext.Provider value={value}>{children}</ChartHistoryContext.Provider>
  );
}

export function useChartHistoryContext() {
  const ctx = useContext(ChartHistoryContext);
  if (!ctx) {
    throw new Error("useChartHistoryContext 需在 ChartHistoryProvider 內使用");
  }
  return ctx;
}
