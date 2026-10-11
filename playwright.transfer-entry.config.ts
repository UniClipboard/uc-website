import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/transfer-site",
  testMatch: "entry.spec.ts",
  workers: 1,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: process.env.TRY_E2E_RESULTS || "test-results/entry.json" },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3213",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: `bun run --cwd apps/try ${process.env.TRY_E2E_DEV ? "dev" : "start"} --port 3213`,
    url: "http://localhost:3213",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_TRY_SHORT_CODE: "1",
      NEXT_PUBLIC_TRY_RENDEZVOUS_URL: "https://rendezvous.e2e.test",
    },
  },
});
