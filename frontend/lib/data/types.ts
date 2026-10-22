export interface BirthFormData {
  name: string;
  date: string;
  time: string;
  timezone: string;
  city: string;
  latitude: string;
  longitude: string;
  houseSystem: string;
  birthTimeUnknown?: boolean;
  /** Optional so existing saved profiles remain valid. Never used by Western calculations. */
  ziwei?: {
    gender?: "male" | "female";
    lateZi?: "next-day" | "current-day";
    leapMonth?: "split" | "next-month" | "prev-month" | "origin-month";
  };
}
