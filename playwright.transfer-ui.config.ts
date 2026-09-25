import { defineConfig, devices } from "@playwright/test";

// UI-only checks for the standalone transfer site. Starts only apps/try (no
// website build) and never opens a relay connection, so it runs quickly and
// needs no network beyond localhost.
export default defineConfig({
  testDir: "./e2e/transfer-site",
  testMatch: "header.spec.ts",
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3212",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: {
    command: "bun run --cwd apps/try start --port 3212",
    url: "http://localhost:3212",
    reuseExistingServer: false,
  },
});
