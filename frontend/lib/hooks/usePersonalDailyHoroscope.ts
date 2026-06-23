"use client";

import { useCallback, useState } from "react";
import { postPersonalDailyHoroscope } from "@/lib/api";
import type { BirthFormData } from "@/lib/data/types";
import type {
  PersonalDailyResponse,
  PersonalDailySectionKey,
} from "@/lib/types/personalDailyHoroscope";
import { PERSONAL_DAILY_SECTION_ORDER } from "@/lib/types/personalDailyHoroscope";
import { sanitizeTransitAiText } from "@/lib/utils/sanitizeTransitAiText";

function sanitizePersonalSections(
  sections: PersonalDailyResponse["sections"],
): PersonalDailyResponse["sections"] {
  const out = { ...sections };
  for (const key of PERSONAL_DAILY_SECTION_ORDER) {
    out[key] = sanitizeTransitAiText(sections[key as PersonalDailySectionKey]);
  }
  return out;
}

export function usePersonalDailyHoroscope() {
  const [result, setResult] = useState<PersonalDailyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (birthData: BirthFormData, profileId: string, force = false) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const id = profileId || crypto.randomUUID();
        const data = await postPersonalDailyHoroscope({
          profileId: id,
          birthData: {
            name: birthData.name,
            date: birthData.date,
            time: birthData.time,
            timezone: birthData.timezone,
            city: birthData.city,
            latitude: birthData.latitude,
            longitude: birthData.longitude,
            houseSystem: birthData.houseSystem,
            birthTimeUnknown: birthData.birthTimeUnknown,
          },
          timezone: birthData.timezone,
          force,
        });
        const sanitized = {
          ...data,
          sections: sanitizePersonalSections(data.sections),
        };
        setResult(sanitized);
        return { data: sanitized, profileId: id };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "生成失敗";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { result, loading, error, generate };
}
