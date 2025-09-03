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
    ],
  },

  // 👇 enable the boot-time hook so we can prep /tmp cache etc.
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
