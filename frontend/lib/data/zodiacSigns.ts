export type ZodiacElement = "fire" | "earth" | "air" | "water";

export interface ZodiacSign {
  id: string;
  nameZh: string;
  nameEn: string;
  symbol: string;
  element: ZodiacElement;
  dateRange: string;
}

/** index 0 = 12 點鐘方向（牡羊座） */
export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  { id: "aries", nameZh: "牡羊座", nameEn: "ARIES", symbol: "♈", element: "fire", dateRange: "3/21 – 4/19" },
  { id: "taurus", nameZh: "金牛座", nameEn: "TAURUS", symbol: "♉", element: "earth", dateRange: "4/20 – 5/20" },
  { id: "gemini", nameZh: "雙子座", nameEn: "GEMINI", symbol: "♊", element: "air", dateRange: "5/21 – 6/20" },
  { id: "cancer", nameZh: "巨蟹座", nameEn: "CANCER", symbol: "♋", element: "water", dateRange: "6/21 – 7/22" },
  { id: "leo", nameZh: "獅子座", nameEn: "LEO", symbol: "♌", element: "fire", dateRange: "7/23 – 8/22" },
  { id: "virgo", nameZh: "處女座", nameEn: "VIRGO", symbol: "♍", element: "earth", dateRange: "8/23 – 9/22" },
  { id: "libra", nameZh: "天秤座", nameEn: "LIBRA", symbol: "♎", element: "air", dateRange: "9/23 – 10/22" },
  { id: "scorpio", nameZh: "天蠍座", nameEn: "SCORPIO", symbol: "♏", element: "water", dateRange: "10/23 – 11/21" },
  { id: "sagittarius", nameZh: "射手座", nameEn: "SAGITTARIUS", symbol: "♐", element: "fire", dateRange: "11/22 – 12/21" },
  { id: "capricorn", nameZh: "摩羯座", nameEn: "CAPRICORN", symbol: "♑", element: "earth", dateRange: "12/22 – 1/19" },
  { id: "aquarius", nameZh: "水瓶座", nameEn: "AQUARIUS", symbol: "♒", element: "air", dateRange: "1/20 – 2/18" },
  { id: "pisces", nameZh: "雙魚座", nameEn: "PISCES", symbol: "♓", element: "water", dateRange: "2/19 – 3/20" },
] as const;

export function getSignByIndex(index: number): ZodiacSign {
  const i = ((index % 12) + 12) % 12;
  return ZODIAC_SIGNS[i];
}

export function getSignById(id: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((s) => s.id === id);
}
