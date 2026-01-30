import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["shubhjn-autoloop.hf.space", "localhost:3000"],
    },
    optimizePackageImports: [
      "lodash-es",
      "date-fns",
      "@radix-ui/react-icons",
      "recharts",
    ],
  },
  // Turbopack configuration for Next.js 16+
  turbopack: {
    resolveAlias: {
      "@": "./",
    },
  },
  webpack: (config, { isServer }) => {
    // Code splitting optimization
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            // Separate vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate Next.js internals
            nextInternal: {
              test: /[\\/]node_modules[\\/](react|next)[\\/]/,
              name: "next-internals",
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separate UI components
            ui: {
              test: /[\\/](components|ui)[\\/]/,
              name: "ui",
              priority: 5,
              minSize: 20000,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

          // Content Security Policy - prevents XSS attacks
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.statically.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
              "object-src 'none'",
              "media-src 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },

          // HSTS - enforce HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },

          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },

          // Additional XSS protection
          { key: "X-XSS-Protection", value: "1; mode=block" },

          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Feature Policy / Permissions Policy
          {
            key: "Permissions-Policy",
            value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
          },
        ],
      },
      // API routes - stricter CSP
      {
        source: "/api/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Type", value: "application/json; charset=utf-8" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
