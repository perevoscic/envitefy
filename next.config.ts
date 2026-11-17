import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import retiredBabyDesigns from "./src/data/baby-shower-retired-designs.json";
import repositoryImageMigrations from "./src/data/repository-image-migrations.json";

const resolveDevDistDir = () => {
  const port = (process.env.PORT || "").trim();
  if (!port || port === "3000") return ".next-dev";
  const sanitizedPort = port.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `.next-dev-${sanitizedPort}`;
};

// These handlers render or extract uploaded/stored PDFs. Page visits, avatars,
// generated artwork and photo-only uploads do not need the PDF runtime.
const pdfRuntimeFiles = [
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-*/**/*",
  "./node_modules/pdfjs-dist/**/*",
];
const pdfProcessingRoutes = [
  "/api/upload",
  "/api/ingest",
  "/api/ocr",
  "/api/create/classify",
  "/api/create/extract",
  "/api/discovery/intake",
  "/api/scan/event-page",
  "/api/football/prefill",
  "/api/discovery/*/run",
  "/api/parse/*/enrich",
  "/api/events/*/original",
];
const liveCardRuntimeFiles = [
  "./public/fonts/birthday/*.ttf",
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-*/**/*",
];
const ffmpegRuntimeFiles = ["./node_modules/ffmpeg-static/ffmpeg*"];
// These handlers can encode WebP with FFmpeg. Shared imports alone do not
// imply execution: discovery status/cancel and history subroutes do not
// encode images, and profile uploads already receive Sharp-produced WebP.
const ffmpegProcessingRoutes = [
  "/api/admin/emails/generate",
  "/api/create/extract",
  "/api/discovery/intake",
  "/api/discovery/*/run",
  "/api/event-themes/generate",
  "/api/events/*/card/edit",
  "/api/events/*/original",
  "/api/events/*/scan-artwork",
  "/api/events/*/source-updates",
  "/api/football/prefill",
  "/api/history",
  "/api/ingest",
  "/api/livecard-builder/design",
  "/api/livecard-builder/headline",
  "/api/livecard-builder/jobs",
  "/api/ocr",
  "/api/parse/*/enrich",
  "/api/scan/event-page",
  "/api/signup-themes/generate",
  "/api/studio/generate",
  "/api/templates/media",
  "/api/upload",
  "/api/uploads/birthday-asset",
];
const processingRoutes = new Set([...pdfProcessingRoutes, ...ffmpegProcessingRoutes]);

const nextConfig = (phase: string): NextConfig => ({
  // Keep dev artifacts out of `.next` so `next build` doesn't race with `next dev`.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? resolveDevDistDir() : ".next",
  devIndicators: false,
  // Preserve CSS dependency order and avoid loose merging of unrelated route
  // modules into the homepage's render-blocking stylesheets.
  experimental: { cssChunking: "strict" },
  async headers() {
    return [{
      source: "/styles/runtime/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
  async redirects() {
    return [
      // Saved event records, cached pages and sent links may retain the old URL.
      ...repositoryImageMigrations.filter(({ source }) => source.startsWith("public/")).map(({ source, destination }) => ({
        source: encodeURI(source.slice(6)).replace(/[():*+?]/g, "\\$&"),
        destination: encodeURI(destination.slice(6)),
        permanent: true,
      })),
      {
        source: "/admin/ad-studio/:path*",
        destination: "/admin",
        permanent: false,
      },
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
  outputFileTracingExcludes: {
    // Campaign media and mail capture are development-only. Never package local
    // screenshots, test databases or generated fixtures with production routes.
    "/*": ["./.qa/**/*"],
  },
  outputFileTracingIncludes: {
    // Next matches these globs as substrings. Require the route to end here so
    // /api/upload and /api/history do not also match other routes.
    ...Object.fromEntries(
      [...processingRoutes].map((route) => [
        `${route}(?![\\s\\S])`,
        [
          ...(pdfProcessingRoutes.includes(route) ? pdfRuntimeFiles : []),
          ...(ffmpegProcessingRoutes.includes(route) ? ffmpegRuntimeFiles : []),
        ],
      ]),
    ),
    "/api/livecard-builder/design": [...liveCardRuntimeFiles],
    "/api/livecard-builder/jobs": [...liveCardRuntimeFiles],
    "/api/livecard-builder/headline": [...liveCardRuntimeFiles],
    "/api/livecard-builder/location": ["./node_modules/geo-tz/data/timezones-1970.geojson.*"],
    "/api/discovery/**": ["./node_modules/geo-tz/data/timezones-1970.geojson.*"],
    "/api/ingest": ["./node_modules/geo-tz/data/timezones-1970.geojson.*"],
    "/api/parse/*/enrich": ["./node_modules/geo-tz/data/timezones-1970.geojson.*"],
    "/*": ["./public/fonts/Josefin_Sans/static/JosefinSans-Regular.ttf"],
  },

  // Load native/heavy dependencies through Node. Their required files still
  // enter deployment traces and count toward Vercel's 250 MB standard limit.
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

export default async function config(phase: string): Promise<NextConfig> {
  // Next 15 typegen also loads this config with PHASE_PRODUCTION_BUILD.
  // Only a real build needs CSS compilation or writes to the runtime manifest.
  // Dev uses globals.css with HMR; type generation must leave those assets alone.
  if (phase === PHASE_PRODUCTION_BUILD && process.argv[2] !== "typegen") {
    const { generateRuntimeStyles } = await import("./scripts/lib/runtime-styles.mjs");
    await generateRuntimeStyles();
  }
  return nextConfig(phase);
}
