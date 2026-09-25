import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

/**
 * TRY_E2E_RENDEZVOUS_URL runs the try-online code tests against a real,
 * local uc-rendezvous instead of the in-browser stub. The page is then served
 * from localhost on its own port, so its Origin matches the service's
 * development CORS allow-list and an already running server (built with the
 * stub URL) is never reused. Only local addresses are accepted.
 */
const LIVE_RENDEZVOUS = process.env.TRY_E2E_RENDEZVOUS_URL;
if (
  LIVE_RENDEZVOUS &&
  !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(LIVE_RENDEZVOUS)
) {
  throw new Error("TRY_E2E_RENDEZVOUS_URL must be a local http:// origin");
}
const PORT = LIVE_RENDEZVOUS ? 3100 : 3000;
const BASE_URL = LIVE_RENDEZVOUS
  ? `http://localhost:${PORT}`
  : `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./src/__tests__/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI && !LIVE_RENDEZVOUS,
    timeout: 120 * 1000,
    // Render GA so the try-online analytics test has something to observe.
    // The test serves a local stand-in for gtag.js; nothing reaches Google.
    env: {
      NEXT_PUBLIC_GA_MEASUREMENT_ID:
        process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-E2ETEST000",
      // The 6-digit code UI, pointed at a host the try-online tests stub in
      // the browser, or at the local rendezvous in live mode (see above).
      // No test reaches the production rendezvous service.
      NEXT_PUBLIC_TRY_SHORT_CODE: "1",
      NEXT_PUBLIC_TRY_RENDEZVOUS_URL:
        LIVE_RENDEZVOUS?.replace(/\/+$/, "") || "https://rendezvous.e2e.test",
      PORT: String(PORT),
    },
  },
});
