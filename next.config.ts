import type { NextConfig } from "next";

const isCI = process.env.CI === "true" || process.env.CI === "1";

// Make bundle analyzer optional to avoid crashing dev if not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withBundleAnalyzer: any = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const analyzer = require("@next/bundle-analyzer")({
      enabled: process.env.ANALYZE === "true",
    });
    return analyzer;
  } catch {
    return (config: NextConfig) => config;
  }
})();

const nextConfig: NextConfig = {
  // Gate lint/type checking by environment: enforce in CI, relax locally
  eslint: { ignoreDuringBuilds: !isCI },
  typescript: { ignoreBuildErrors: !isCI },
  images: {
    formats: ["image/avif", "image/webp"],
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
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  experimental: { serverComponentsHmrCache: true },
};

export default withBundleAnalyzer(nextConfig);
