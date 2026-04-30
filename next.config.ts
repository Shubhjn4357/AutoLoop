import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Enable standalone only in Docker/CI (set BUILD_STANDALONE=true in environment)
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Prevent native libsql binaries from being bundled (needed for Cloudflare + HuggingFace)
  serverExternalPackages: ["libsql", "@libsql/isomorphic-ws"],
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
