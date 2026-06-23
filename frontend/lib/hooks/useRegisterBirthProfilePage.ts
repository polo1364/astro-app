"use client";

import { useEffect } from "react";
import {
  useBirthProfileContext,
  type BirthProfilePageHandlers,
} from "@/lib/context/BirthProfileContext";

export function useRegisterBirthProfilePage(handlers: BirthProfilePageHandlers) {
  const { registerPage } = useBirthProfileContext();

  useEffect(() => {
    registerPage(handlers);
    return () => registerPage(null);
  }, [handlers, registerPage]);
}
