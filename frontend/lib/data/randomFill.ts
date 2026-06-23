import type { BirthFormData } from "./types";
import { sampleProfiles } from "./sampleProfiles";
import { pickSampleTransitDate } from "./sampleTransitDates";
import { findCityByCoords } from "./locations";

export function pickSampleBirth(): BirthFormData {
  const profile = sampleProfiles[Math.floor(Math.random() * sampleProfiles.length)];
  const { id: _id, label: _label, description: _desc, ...data } = profile;
  const city = data.city || findCityByCoords(data.latitude, data.longitude);
  return { ...data, city, birthTimeUnknown: data.birthTimeUnknown ?? false };
}

export { pickSampleTransitDate };
