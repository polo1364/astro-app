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
import { defaultBirthData } from "@/lib/data/defaultBirthData";

export interface BirthProfilePageHandlers {
  birthData: BirthFormData;
  setBirthData: Dispatch<SetStateAction<BirthFormData>>;
  activeProfileId: string | null;
  setActiveProfileId: Dispatch<SetStateAction<string | null>>;
}

interface BirthProfileContextValue {
  sharedForm: BirthProfilePageHandlers;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  refreshToken: number;
  notifySaved: (id: string) => void;
  pageHandlers: BirthProfilePageHandlers | null;
  registerPage: (handlers: BirthProfilePageHandlers | null) => void;
}

const BirthProfileContext = createContext<BirthProfileContextValue | null>(null);

export function BirthProfileProvider({ children }: { children: ReactNode }) {
  const [birthData, setBirthData] = useState<BirthFormData>(defaultBirthData);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const sharedForm = useMemo(
    () => ({ birthData, setBirthData, activeProfileId, setActiveProfileId }),
    [birthData, activeProfileId],
  );
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
      sharedForm,
      modalOpen,
      setModalOpen,
      refreshToken,
      notifySaved,
      pageHandlers,
      registerPage,
    }),
    [sharedForm, modalOpen, refreshToken, notifySaved, pageHandlers, registerPage],
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
