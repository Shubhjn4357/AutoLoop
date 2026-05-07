import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Only enable standalone output if explicitly requested (e.g. CI or OpenNext packaging)
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Prevent native binaries and heavy UI libs from being bundled into the server function
  serverExternalPackages: [
    "libsql",
    "@libsql/isomorphic-ws",
    "gsap",
    "@gsap/react",
    "recharts",
  ],
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
