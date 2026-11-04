const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { hasTestCredentials } = require("../utils/clerk-auth");
const { PlaygroundPage } = require("../pages/playground-page");
const { HORIZON_VARIANTS } = require("../config/live-products");
const { getEnvironment } = require("../config/environment");

const AUTH_FILE = path.resolve(__dirname, "../../.auth/playground.json");

function skipUnlessAuthReady(testInfo) {
  if (!hasTestCredentials() || !fs.existsSync(AUTH_FILE)) {
    testInfo.skip(true, "Requires SHUNYA_TEST_* in .env and global auth setup.");
  }
}

test.describe("[Playground] Horizon (Listen)", () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeEach(async ({ page }, testInfo) => {
    skipUnlessAuthReady(testInfo);
    const env = getEnvironment();
    await page.goto(env.playgroundUrl, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/playground/, { timeout: 60_000 });
    const pg = new PlaygroundPage(page);
    await pg.openListenHorizon();
  });

  for (const variant of HORIZON_VARIANTS) {
    test(`${variant.id} variant is selectable`, async ({ page }) => {
      const tab = page.getByText(variant.label).first();
      await tab.click({ force: true }).catch(() => tab.click());
      await expect(
        page.getByRole("button", { name: /RECORD|TRANSCRIBE A SAMPLE|UPLOAD A FILE/i }).first(),
      ).toBeVisible({ timeout: 60_000 });
    });
  }

  test("english language control is visible", async ({ page }) => {
    await expect(page.getByText(/^English$/i).first()).toBeVisible({ timeout: 30_000 });
  });
});
