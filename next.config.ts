import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Produce a minimal standalone server for Docker/App Runner
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fonts.gstatic.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "static.thenounproject.com" },
    ],
  },
  webpack: (config: any) => {
    // Ensure alias resolution works consistently in all environments (e.g., Docker Linux)
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["@"] = config.resolve.alias["@"] || path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
