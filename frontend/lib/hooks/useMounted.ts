"use client";

import { useEffect, useState } from "react";

/** True only after the client has mounted (avoids SSR/client markup drift). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
