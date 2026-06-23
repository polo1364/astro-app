import { isStaleBackendResponse, normalizeNatalResult } from "@/lib/normalizeNatal";
import { isStaleTransitResponse, normalizeTransitResult } from "@/lib/normalizeTransit";
import type { PublicDailyBatch } from "@/lib/types/dailyHoroscope";
import type { PersonalDailyResponse } from "@/lib/types/personalDailyHoroscope";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers);
  const hasBody = options?.body != null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    let message = "請求失敗";
    if (typeof err.detail === "string") {
      message = err.detail;
    } else if (Array.isArray(err.detail)) {
      message = err.detail.map((d: { msg?: string }) => d.msg).join("; ");
    }
    if (res.status === 404 && message === "Not Found") {
      message = "API 路由不存在（請重啟後端以載入每日運勢模組）";
    }
    throw new Error(message);
  }
  return res.json();
}

export interface DeepSeekStatus {
  configured: boolean;
  maskedKey?: string;
}

export async function getDeepSeekStatus(): Promise<DeepSeekStatus> {
  return request<DeepSeekStatus>("/settings/deepseek");
}

export async function saveDeepSeekKey(apiKey: string): Promise<void> {
  await request("/settings/deepseek", {
    method: "PUT",
    body: JSON.stringify({ apiKey }),
  });
}

export async function testDeepSeekConnection(): Promise<{ success: boolean; message: string }> {
  return request("/settings/deepseek/test", { method: "POST" });
}

export interface ApiUsageTotals {
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ApiUsageByFeature {
  feature: string;
  labelZh: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ApiUsageSummary {
  totals: ApiUsageTotals;
  byFeature: ApiUsageByFeature[];
}

export async function getApiUsage(): Promise<ApiUsageSummary> {
  return request<ApiUsageSummary>("/settings/api-usage");
}

export interface HomeVisitResponse {
  recorded: boolean;
  totalCount: number;
}

export async function recordHomeVisit(visitorId: string): Promise<HomeVisitResponse> {
  return request<HomeVisitResponse>("/stats/home-visit", {
    method: "POST",
    body: JSON.stringify({ visitorId }),
  });
}

export interface VisitorStats {
  totalCount: number;
}

export async function getVisitorTotal(): Promise<VisitorStats> {
  return request<VisitorStats>("/stats/visitors");
}

export async function interpretNatal(chartSummary: object): Promise<{ text: string; sectionsAi?: string }> {
  return request("/interpret/natal", {
    method: "POST",
    body: JSON.stringify(chartSummary),
  });
}

export async function interpretTransit(chartSummary: object): Promise<{ text: string; sectionsAi?: string }> {
  return request("/interpret/transit", {
    method: "POST",
    body: JSON.stringify(chartSummary),
  });
}

export interface NatalRequestBody {
  name?: string;
  date: string;
  time?: string | null;
  timezone: string;
  latitude: number;
  longitude: number;
  houseSystem: string;
  location?: string;
  birthTimeUnknown?: boolean;
}

export interface TransitRequestBody extends NatalRequestBody {
  transitDate: string;
  transitTime?: string | null;
}

export async function calculateNatal(body: NatalRequestBody) {
  const raw = await request<Record<string, unknown>>("/natal", {
    method: "POST",
    body: JSON.stringify({
      name: body.name ?? "",
      date: body.date,
      time: body.birthTimeUnknown ? null : body.time,
      timezone: body.timezone,
      latitude: body.latitude,
      longitude: body.longitude,
      house_system: body.houseSystem,
      location: body.location ?? body.name ?? "",
      birth_time_unknown: body.birthTimeUnknown ?? false,
    }),
  });
  const result = normalizeNatalResult(raw);
  if (isStaleBackendResponse(raw)) {
    throw new Error("STALE_BACKEND");
  }
  return result;
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  apiVersion?: string;
  features?: string[];
}> {
  try {
    const res = await request<{
      status: string;
      apiVersion?: string;
      api_version?: string;
      features?: string[];
    }>("/health");
    const version = res.apiVersion ?? res.api_version;
    const features = res.features ?? [];
    const ok =
      res.status === "ok"
      && (version === "2" || features.includes("natal_analysis"))
      && (features.includes("transit") || features.includes("transit_analysis"));
    return { ok, apiVersion: version, features };
  } catch {
    return { ok: false };
  }
}

export async function calculateTransit(body: TransitRequestBody) {
  const raw = await request<Record<string, unknown>>("/transit", {
    method: "POST",
    body: JSON.stringify({
      name: body.name ?? "",
      date: body.date,
      time: body.birthTimeUnknown ? null : body.time,
      timezone: body.timezone,
      latitude: body.latitude,
      longitude: body.longitude,
      house_system: body.houseSystem,
      location: body.location ?? body.name ?? "",
      birth_time_unknown: body.birthTimeUnknown ?? false,
      transit_date: body.transitDate,
      transit_time: body.transitTime || null,
    }),
  });
  const result = normalizeTransitResult(raw);
  if (isStaleTransitResponse(raw)) {
    throw new Error("STALE_BACKEND");
  }
  return result;
}

export async function getPublicDailyHoroscopes(
  date?: string
): Promise<PublicDailyBatch> {
  const q = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<PublicDailyBatch>(`/daily/public${q}`);
}

export interface PersonalBirthFormBody {
  name?: string;
  date: string;
  time?: string;
  timezone: string;
  city?: string;
  latitude: string | number;
  longitude: string | number;
  houseSystem: string;
  birthTimeUnknown?: boolean;
}

export interface PersonalDailyRequestBody {
  profileId: string;
  birthData: PersonalBirthFormBody;
  date?: string;
  timezone?: string;
  force?: boolean;
}

export async function postPersonalDailyHoroscope(
  body: PersonalDailyRequestBody,
  signal?: AbortSignal,
): Promise<PersonalDailyResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  const mergedSignal = signal ?? controller.signal;

  try {
    const res = await fetch(`${API_BASE}/daily/personal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: body.profileId,
        birth_data: {
          name: body.birthData.name ?? "",
          date: body.birthData.date,
          time: body.birthData.birthTimeUnknown ? null : body.birthData.time,
          timezone: body.birthData.timezone,
          latitude: parseFloat(String(body.birthData.latitude)),
          longitude: parseFloat(String(body.birthData.longitude)),
          house_system: body.birthData.houseSystem,
          location: body.birthData.city || body.birthData.name || "",
          birth_time_unknown: body.birthData.birthTimeUnknown ?? false,
        },
        date: body.date,
        timezone: body.timezone,
        force: body.force ?? false,
      }),
      signal: mergedSignal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      let message =
        typeof err.detail === "string" ? err.detail : "個人每日行運生成失敗";
      if (Array.isArray(err.detail)) {
        message = err.detail.map((d: { msg?: string }) => d.msg).join("; ");
      }
      if (res.status === 404 && message === "Not Found") {
        message = "API 路由不存在（請重啟後端以載入個人每日行運模組）";
      }
      throw new Error(message);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPersonalDailyHoroscope(
  profileId: string,
  date?: string,
): Promise<PersonalDailyResponse> {
  const q = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<PersonalDailyResponse>(`/daily/personal/${profileId}${q}`);
}

export interface PersonalShareUploadResponse {
  token: string;
  sharePageUrl: string;
  imageUrl: string;
}

export async function uploadPersonalShareImage(
  blob: Blob,
  filename: string,
  title: string,
  description: string,
): Promise<PersonalShareUploadResponse> {
  const form = new FormData();
  form.append("image", blob, filename);
  form.append("title", title);
  form.append("description", description);

  const res = await fetch(`${API_BASE}/share/personal-daily`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const message =
      typeof err.detail === "string" ? err.detail : "上傳分享圖片失敗";
    throw new Error(message);
  }
  const raw = await res.json();
  return {
    token: raw.token,
    sharePageUrl: raw.share_page_url,
    imageUrl: raw.image_url,
  };
}
