"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPublicDailyHoroscopes } from "@/lib/api";
import { MOCK_DAILY_HOROSCOPES } from "@/lib/mock/mockDailyHoroscope";
import type { DailyHoroscopeEntry, PublicDailyBatch } from "@/lib/types/dailyHoroscope";
import { batchEntryToHoroscope } from "@/lib/types/dailyHoroscope";
import { getTaipeiYMD, msUntilNextTaipeiMidnight } from "@/lib/utils/taipeiDate";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DAILY === "true";
const POLL_MS = 30_000;

function buildMockBatch(): PublicDailyBatch {
  return {
    date: getTaipeiYMD(),
    timezone: "Asia/Taipei",
    status: "ready",
    passed_sign_count: 12,
    sky_summary: null,
    signs: Object.fromEntries(
      Object.entries(MOCK_DAILY_HOROSCOPES).map(([id, entry]) => [
        id,
        {
          sections: {
            theme:
              entry.sections.find((s) => s.title.includes("整體"))?.body ??
              entry.summary,
            work:
              entry.sections.find((s) => s.title.includes("事業"))?.body ?? "",
            love:
              entry.sections.find((s) => s.title.includes("愛情"))?.body ?? "",
            money:
              entry.sections.find((s) => s.title.includes("財運"))?.body ?? "",
            health: "注意作息與飲食均衡。",
            advice: entry.sections[0]?.body.slice(0, 40) ?? "",
            evidence: "示範資料。",
          },
        },
      ])
    ),
  };
}

export function useDailyHoroscope() {
  const [batch, setBatch] = useState<PublicDailyBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dateKeyRef = useRef(getTaipeiYMD());

  const fetchBatch = useCallback(async () => {
    if (USE_MOCK) {
      setBatch(buildMockBatch());
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getPublicDailyHoroscopes();
      setBatch(data);
      dateKeyRef.current = data.date;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "載入失敗";
      setError(
        msg.includes("API 路由不存在")
          ? `${msg}（目前顯示示範資料）`
          : msg.includes("Failed to fetch") || msg.includes("fetch")
            ? "無法連線後端 API（目前顯示示範資料）"
            : `${msg}（目前顯示示範資料）`
      );
      setBatch(buildMockBatch());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBatch();
  }, [fetchBatch]);

  useEffect(() => {
    if (USE_MOCK || !batch || batch.status === "ready") return;
    const id = window.setInterval(() => void fetchBatch(), POLL_MS);
    return () => window.clearInterval(id);
  }, [batch?.status, fetchBatch]);

  useEffect(() => {
    let timerId = 0;
    const schedule = () => {
      const ms = msUntilNextTaipeiMidnight();
      timerId = window.setTimeout(() => {
        void fetchBatch();
        schedule();
      }, ms);
    };
    schedule();
    return () => window.clearTimeout(timerId);
  }, [fetchBatch]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const today = getTaipeiYMD();
      if (today !== dateKeyRef.current) {
        void fetchBatch();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchBatch]);

  const horoscopesBySignId: Record<string, DailyHoroscopeEntry> = {};
  if (batch) {
    for (const [signId, item] of Object.entries(batch.signs)) {
      horoscopesBySignId[signId] = batchEntryToHoroscope(signId, item.sections);
    }
  }

  const getHoroscope = (signId: string): DailyHoroscopeEntry | null =>
    horoscopesBySignId[signId] ?? null;

  return {
    batch,
    loading,
    error,
    horoscopesBySignId,
    getHoroscope,
    refetch: fetchBatch,
  };
}
