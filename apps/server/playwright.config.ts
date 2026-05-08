import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:7860",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:7860",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      PORT: "7860",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
