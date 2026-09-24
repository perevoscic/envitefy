import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import retiredBabyDesigns from "./src/data/baby-shower-retired-designs.json";

const resolveDevDistDir = () => {
  const port = (process.env.PORT || "").trim();
  if (!port || port === "3000") return ".next-dev";
  const sanitizedPort = port.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `.next-dev-${sanitizedPort}`;
};

const nextConfig = (phase: string): NextConfig => ({
  // Keep dev artifacts out of `.next` so `next build` doesn't race with `next dev`.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? resolveDevDistDir() : ".next",
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/livacards-invites",
        destination: "/live-cards",
        permanent: true,
      },
      ...Object.entries(retiredBabyDesigns).map(([retired, replacement]) => ({
        source: `/templates/baby-showers/${retired}.webp`,
        destination: `/templates/baby-showers/${replacement}.webp`,
        permanent: true,
      })),
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "tsconfig.application.json",
  },
  // Only enable standalone output for production builds.
  // `next dev` is more stable when it runs without standalone packaging artifacts.
  ...(phase === PHASE_DEVELOPMENT_SERVER ? {} : { output: "standalone" }),
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/livecard-builder/location": ["./node_modules/geo-tz/data/timezones-1970.geojson.*"],
    "/api/upload": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/uploads/*": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/studio/generate": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/events/*/card/edit": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/admin/emails/generate": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/user/profile/avatar": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/templates/media": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/discovery/**": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/ingest": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/football/prefill": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/ocr": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/history": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/scan/event-page": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/events/*/scan-artwork": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/api/events/*/original": ["./node_modules/ffmpeg-static/ffmpeg*"],
    "/*": [
      "./public/fonts/Josefin_Sans/static/JosefinSans-Regular.ttf",
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/pdf-parse/**/*",
    ],
  },

  // Keep heavy server deps out of the serverless bundle (stays under Vercel 300MB limit)
  serverExternalPackages: [
    "geo-tz",
    "@google-cloud/vision",
    "@google-cloud/aiplatform",
    "@google-cloud/vertexai",
    "@google-cloud/storage",
    "@napi-rs/canvas",
    "openai",
    "pdfjs-dist",
    "googleapis",
    "sharp",
    "ffmpeg-static",
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fonts.gstatic.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "static.thenounproject.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
});

export default nextConfig;
