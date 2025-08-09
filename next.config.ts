import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsHmrCache: true,
  },
};

export default nextConfig;
