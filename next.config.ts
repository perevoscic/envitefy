import type { NextConfig } from "next";

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
};

export default nextConfig;
