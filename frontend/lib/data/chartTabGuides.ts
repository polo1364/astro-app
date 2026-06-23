export type ChartTabGuideKey =
  | "chart"
  | "planets"
  | "aspects"
  | "houses"
  | "transit-dual"
  | "transit-aspects"
  | "transit-planets";

export interface ChartTabGuideContent {
  title: string;
  body: string;
}

export const CHART_TAB_GUIDES: Record<ChartTabGuideKey, ChartTabGuideContent> = {
  chart: {
    title: "這張圓圖在看什麼？",
    body:
      "就是你出生那一刻天空的整理版。圓裡的點是十顆星（太陽、月亮等），外圈是十二種性格底色。線代表兩顆星好不好配合。下面列表用白話說每顆星在管人生哪一塊。",
  },
  planets: {
    title: "這張表怎麼看？",
    body:
      "每一行是一顆星。星座＝用什麼個性去表現；度數＝在星座裡的第幾站；宮位＝比較常落在人生哪一區（要有準確出生時間）。R 表示這段時間宜慢不宜衝。",
  },
  aspects: {
    title: "這張表怎麼看？",
    body:
      "每一條是兩顆星的關係。先看上面名字與中間的「合／刑／沖」等，下面一行是用白話說這代表什麼。右邊數字越小越精，強／中／弱看影響大小。",
  },
  houses: {
    title: "這張表怎麼看？",
    body:
      "人生切成 12 區，每一列是其中一區的「起點」。度數是起點在星座裡的位置，不是第幾宮。1 和 7、2 和 8 度數一樣是正常的（正對面）。要有出生時間才算得出來。",
  },
  "transit-dual": {
    title: "雙盤怎麼看？",
    body:
      "外圈是選定那天的星，內圈是你出生盤。兩圈疊在一起看「現在碰到你哪裡」。",
  },
  "transit-aspects": {
    title: "行運相位怎麼看？",
    body:
      "每一條是「現在的某顆星」對「你本命某個點」的關係。先看顏色與強度，下面一行是白話。",
  },
  "transit-planets": {
    title: "當日行星怎麼看？",
    body:
      "選定那天十顆星各在哪個星座。落宮欄要出生時間準才準。",
  },
};
