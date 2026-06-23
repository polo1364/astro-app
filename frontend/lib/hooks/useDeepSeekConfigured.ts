"use client";

import { useEffect, useState } from "react";
import { getDeepSeekStatus } from "@/lib/api";

/**
 * Returns whether DeepSeek API key is configured on the backend.
 * Initial state is false (show settings button) until confirmed configured.
 */
export function useDeepSeekConfigured(): boolean {
  const [configured, setConfigured] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDeepSeekStatus()
      .then((status) => {
        if (!cancelled) {
          setConfigured(status.configured);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfigured(false);
          setChecked(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return checked && configured;
}
