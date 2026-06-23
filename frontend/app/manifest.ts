import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants/appMeta";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — 專業占星工作台`,
    short_name: APP_NAME,
    description: "繁中專業占星工作台，採 Swiss Ephemeris 星曆引擎",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05040b",
    theme_color: "#05040b",
    lang: "zh-TW",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
