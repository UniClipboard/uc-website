import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/transfer-site",
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  // Trace, video and automatic screenshots would retain connection secrets.
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3210",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: [
    {
      command: "bun run --cwd apps/try start --port 3210",
      url: "http://localhost:3210",
      reuseExistingServer: false,
    },
    {
      command: "bun run start --port 3211",
      url: "http://localhost:3211/try",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_TRY_SITE_URL: "http://localhost:3210",
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-E2ETEST000",
      },
    },
  ],
});
