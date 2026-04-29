import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone only in Docker/CI (set BUILD_STANDALONE=true in environment)
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  // Prevent native libsql binaries from being bundled (needed for Cloudflare + HuggingFace)
  serverExternalPackages: ["libsql", "@libsql/isomorphic-ws"],
};

export default nextConfig;
