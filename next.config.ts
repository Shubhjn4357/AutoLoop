import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone only in Docker/CI (set BUILD_STANDALONE=true in environment)
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  experimental: {
    serverExternalPackages: ["@libsql/isomorphic-ws"],
  },
};

export default nextConfig;
