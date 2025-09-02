import type { NextConfig } from "next";


// next.config.js

console.log(">>> SNAP-MY-DATE App Runner starting…");
console.log(">>> GOOGLE_APPLICATION_CREDENTIALS_BASE64 present?:", !!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64);
console.log(">>> GOOGLE_APPLICATION_CREDENTIALS_JSON present?:", !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

module.exports = {
  reactStrictMode: true,
  // ... keep your existing Next.js config here
};

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    // Allow production builds to successfully complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if there are type errors
    // Remove this once type errors are addressed
    ignoreBuildErrors: true,
  },
  // Produce a minimal standalone server for Docker deployment
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fonts.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
