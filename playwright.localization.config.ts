import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/localization",
  outputDir: "./.herdr-project/uni-t-0058/library/e2e-results",
  reporter: [
    ["list"],
    ["json", { outputFile: ".herdr-project/uni-t-0058/library/e2e.json" }],
  ],
  workers: 2,
  timeout: 60_000,
  use: { baseURL: "http://localhost:3158", trace: "retain-on-failure" },
});
