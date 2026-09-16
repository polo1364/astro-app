import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

function apiRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return [];
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: "/share/**",
      },
    ];
  } catch {
    return [];
  }
}

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// Pin the project root to this frontend folder so Next.js/Turbopack does not
// mistakenly infer C:\Users\User (which has its own package-lock.json) as root.
const projectRoot =
  typeof __dirname !== "undefined" ? __dirname : process.cwd();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: apiRemotePatterns(),
  },
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default withSerwist(nextConfig);
