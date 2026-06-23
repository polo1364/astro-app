"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getVisitorTotal, recordHomeVisit } from "@/lib/api";
import { useMounted } from "@/lib/hooks/useMounted";
import { getTaipeiYMD } from "@/lib/utils/taipeiDate";

const VISITOR_ID_KEY = "visitor_id";

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

    let cancelled = false;

    async function load() {
      try {
        if (pathname === "/" && !hasSentToday()) {
          const visitorId = getOrCreateVisitorId();
          const result = await recordHomeVisit(visitorId);
          if (!cancelled) {
            markSentToday();
            setCount(result.totalCount);
          }
        } else {
          const result = await getVisitorTotal();
          if (!cancelled) {
            setCount(result.totalCount);
          }
        }
      } catch {
        if (!cancelled) {
          setCount(null);
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
