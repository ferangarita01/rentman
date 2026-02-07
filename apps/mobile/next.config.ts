import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  output: 'export',
  images: {
    unoptimized: true
  }
};

export default nextConfig;
