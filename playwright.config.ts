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
  use: {
    trace: "off",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
