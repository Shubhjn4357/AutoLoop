import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Only enable standalone output if explicitly requested (e.g. CI or OpenNext packaging)
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Prevent native binaries from being bundled (needed for Cloudflare + HuggingFace)
  serverExternalPackages: ["libsql", "@libsql/isomorphic-ws"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
