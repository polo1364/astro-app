"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { BirthFormData } from "@/lib/data/types";

export interface BirthProfilePageHandlers {
  birthData: BirthFormData;
  setBirthData: Dispatch<SetStateAction<BirthFormData>>;
  activeProfileId: string | null;
  setActiveProfileId: Dispatch<SetStateAction<string | null>>;
}

interface BirthProfileContextValue {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  refreshToken: number;
  notifySaved: (id: string) => void;
  pageHandlers: BirthProfilePageHandlers | null;
  registerPage: (handlers: BirthProfilePageHandlers | null) => void;
}

const BirthProfileContext = createContext<BirthProfileContextValue | null>(null);

export function BirthProfileProvider({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pageHandlers, setPageHandlers] = useState<BirthProfilePageHandlers | null>(null);

  const registerPage = useCallback((handlers: BirthProfilePageHandlers | null) => {
    setPageHandlers(handlers);
  }, []);

  const notifySaved = useCallback((_id: string) => {
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
    <BirthProfileContext.Provider value={value}>{children}</BirthProfileContext.Provider>
  );
}

export function useBirthProfileContext() {
  const ctx = useContext(BirthProfileContext);
  if (!ctx) {
    throw new Error("useBirthProfileContext 需在 BirthProfileProvider 內使用");
  }
  return ctx;
}
