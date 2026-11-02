import { defineConfig } from "@playwright/test";

const isCI = Boolean((globalThis as { process?: { env?: { CI?: string } } }).process?.env?.CI);
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const playwrightJsonReport =
  env?.PLAYWRIGHT_REPORT_FRAGMENT ||
  env?.HEALTH_REPORT_JSON ||
  "reports/playwright-report.json";

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  fullyParallel: true,
  workers: 3,
  expect: {
    timeout: 5_000,
  },
  retries: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "reports/html" }],
    ["json", { outputFile: playwrightJsonReport }],
  ],
  projects: [
    {
      name: "site",
      testMatch: /tests\/site\/.*\.spec\.js/,
      fullyParallel: true,
      workers: 2,
      use: {
        browserName: "chromium",
        trace: "off",
        screenshot: "only-on-failure",
      },
    },
    {
      name: "health",
      testMatch: /tests\/api\/health\/.*\.spec\.js/,
      retries: 0,
      timeout: 120_000,
      fullyParallel: false,
      workers: 1,
    },
    {
      name: "api",
      testMatch: /tests\/api\/(?!health\/).*\.spec\.js/,
    },
    {
      name: "ui",
      testMatch: /tests\/(?!api\/).*\.spec\.js/,
      fullyParallel: false,
      workers: 1,
      use: {
        browserName: "chromium",
        trace: "off",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
  ],
});
