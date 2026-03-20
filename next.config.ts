import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

const nextConfig = (phase: string): NextConfig => ({
  // Keep dev artifacts out of `.next` so `next build` doesn't race with `next dev`.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Only enable standalone output for production builds.
  // `next dev` is more stable when it runs without standalone packaging artifacts.
  ...(phase === PHASE_DEVELOPMENT_SERVER ? {} : { output: "standalone" }),

  // Keep heavy server deps out of the serverless bundle (stays under Vercel 300MB limit)
  serverExternalPackages: [
    "@google-cloud/vision",
    "@google-cloud/aiplatform",
    "@google-cloud/vertexai",
    "@google-cloud/storage",
    "@napi-rs/canvas",
    "openai",
    "pdfjs-dist",
    "googleapis",
    "sharp",
    "@aws-sdk/client-sesv2",
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
