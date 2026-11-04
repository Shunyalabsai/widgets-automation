const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { hasTestCredentials } = require("../utils/clerk-auth");
const { getEnvironment } = require("../config/environment");

const AUTH_FILE = path.resolve(__dirname, "../../.auth/playground.json");

test.describe("[Playground] Auth gate", () => {
  test.use({ storageState: AUTH_FILE });

  test("signed-in user reaches playground console", async ({ page }, testInfo) => {
    if (!hasTestCredentials() || !fs.existsSync(AUTH_FILE)) {
      testInfo.skip(true, "Requires SHUNYA_TEST_* in .env.");
    }
    const env = getEnvironment();
    await page.goto(env.playgroundUrl, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/playground/);
    await expect(page.getByRole("link", { name: "Listen", exact: true })).toBeVisible({
      timeout: 60_000,
    });
  });
});
