export interface TaiwanCity {
  name: string;
  lat: string;
  lng: string;
}

export const taiwanCities: TaiwanCity[] = [
  { name: "台北", lat: "25.0330", lng: "121.5654" },
  { name: "新北", lat: "25.0169", lng: "121.4628" },
  { name: "基隆", lat: "25.1276", lng: "121.7392" },
  { name: "桃園", lat: "24.9936", lng: "121.3010" },
  { name: "新竹", lat: "24.8138", lng: "120.9675" },
  { name: "台中", lat: "24.1477", lng: "120.6736" },
  { name: "嘉義", lat: "23.4801", lng: "120.4491" },
  { name: "台南", lat: "22.9999", lng: "120.2269" },
  { name: "高雄", lat: "22.6273", lng: "120.3014" },
  { name: "屏東", lat: "22.6690", lng: "120.4880" },
  { name: "花蓮", lat: "23.9871", lng: "121.6011" },
  { name: "台東", lat: "22.7583", lng: "121.1444" },
];

export function findCityByCoords(lat: string, lng: string): string {
  const match = taiwanCities.find((c) => c.lat === lat && c.lng === lng);
  return match?.name ?? "";
}
