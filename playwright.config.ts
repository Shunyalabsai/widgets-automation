import { defineConfig } from "@playwright/test";

const isCI = Boolean((globalThis as { process?: { env?: { CI?: string } } }).process?.env?.CI);

export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  fullyParallel: true,
  workers: isCI ? 3 : undefined,
  expect: {
    timeout: 5_000,
  },
  retries: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "reports/html" }],
    ["json", { outputFile: "reports/playwright-report.json" }],
  ],
  projects: [
    {
      name: "api",
      testMatch: /tests\/api\/.*\.spec\.js/,
    },
    {
      name: "ui",
      testMatch: /tests\/(?!api\/).*\.spec\.js/,
      workers: isCI ? 2 : 2,
      use: {
        browserName: "chromium",
        trace: "off",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
      },
    },
  ],
});
