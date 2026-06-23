"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getVisitorTotal, recordHomeVisit } from "@/lib/api";
import { useMounted } from "@/lib/hooks/useMounted";
import { getTaipeiYMD } from "@/lib/utils/taipeiDate";

const VISITOR_ID_KEY = "visitor_id";
const VISITOR_TOTAL_CACHE_KEY = "astro_visitor_total";

function parseVisitorTotal(raw: { totalCount?: number; total_count?: number }): number {
  const value = raw.totalCount ?? raw.total_count;
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function readCachedVisitorTotal(): number | null {
  try {
    const raw = localStorage.getItem(VISITOR_TOTAL_CACHE_KEY);
    if (raw == null) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  } catch {
    return null;
  }
}

function writeCachedVisitorTotal(total: number): void {
  try {
    localStorage.setItem(VISITOR_TOTAL_CACHE_KEY, String(Math.max(0, total)));
  } catch {
    // ignore quota / private mode
  }
}

function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

function sessionVisitKey(): string {
  return `home_visit_sent_${getTaipeiYMD()}`;
}

function hasSentToday(): boolean {
  try {
    return sessionStorage.getItem(sessionVisitKey()) === "1";
  } catch {
    return false;
  }
}

function markSentToday(): void {
  try {
    sessionStorage.setItem(sessionVisitKey(), "1");
  } catch {
    // ignore quota / private mode
  }
}

export function useVisitorCount(): number | null {
  const pathname = usePathname();
  const mounted = useMounted();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!mounted) return;

    const cached = readCachedVisitorTotal();
    if (cached !== null) {
      setCount(cached);
    }

    let cancelled = false;

    async function load() {
      try {
        if (pathname === "/" && !hasSentToday()) {
          const visitorId = getOrCreateVisitorId();
          const result = await recordHomeVisit(visitorId);
          if (!cancelled) {
            markSentToday();
            const total = parseVisitorTotal(result);
            writeCachedVisitorTotal(total);
            setCount(total);
          }
        } else {
          const result = await getVisitorTotal();
          if (!cancelled) {
            const total = parseVisitorTotal(result);
            writeCachedVisitorTotal(total);
            setCount(total);
          }
        }
      } catch {
        if (!cancelled) {
          const cached = readCachedVisitorTotal();
          setCount(cached);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [mounted, pathname]);

  return mounted ? count : null;
}
