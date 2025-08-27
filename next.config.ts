import type { NextConfig } from "next";

const isCI = process.env.CI === "true" || process.env.CI === "1";

const nextConfig: NextConfig = {
  // Gate lint/type checking by environment: enforce in CI, relax locally
  eslint: { ignoreDuringBuilds: !isCI },
  typescript: { ignoreBuildErrors: !isCI },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "scontent.xx.fbcdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "taphoammo.net",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: { serverComponentsHmrCache: true },
};

export default nextConfig;
