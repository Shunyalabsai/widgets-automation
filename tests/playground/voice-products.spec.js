const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { hasTestCredentials } = require("../utils/clerk-auth");
const { PlaygroundPage } = require("../pages/playground-page");
const { getEnvironment } = require("../config/environment");

const AUTH_FILE = path.resolve(__dirname, "../../.auth/playground.json");

function skipUnlessAuthReady(testInfo) {
  if (!hasTestCredentials() || !fs.existsSync(AUTH_FILE)) {
    testInfo.skip(true, "Requires SHUNYA_TEST_* in .env and global auth setup.");
  }
}

test.describe("[Playground] Voice products", () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeEach(async ({ page }, testInfo) => {
    skipUnlessAuthReady(testInfo);
    const env = getEnvironment();
    await page.goto(env.playgroundUrl, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/playground/, { timeout: 60_000 });
  });

  test("Speak (Radiance) workspace loads", async ({ page }) => {
    const pg = new PlaygroundPage(page);
    await pg.openSpeakRadiance();
    await expect(pg.mainWorkspace().locator("textarea").first()).toBeVisible({ timeout: 60_000 });
  });

  test("Translate (Parallax) workspace loads", async ({ page }) => {
    const pg = new PlaygroundPage(page);
    await pg.openTranslateParallax();
    await expect(
      pg.mainWorkspace().getByRole("button", { name: /RECORD|UPLOAD|TRANSCRIBE|SAMPLE/i }).first(),
    ).toBeVisible();
  });

  test("Voice agents (Resonance) route loads", async ({ page }) => {
    const env = getEnvironment();
    await page.goto(`${env.playgroundUrl.replace(/\/$/, "")}/resonance`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForURL(/\/playground\/resonance/, { timeout: 60_000 });
    const main = page.locator("main").first();
    await expect(main.getByRole("button").first()).toBeVisible({ timeout: 60_000 });
  });

  test("API keys account page loads", async ({ page }) => {
    const env = getEnvironment();
    await page.goto(`${env.playgroundUrl.replace(/\/$/, "")}/api-keys`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForURL(/\/playground\/api-keys/, { timeout: 60_000 });
    await expect(page.getByText(/API keys|Generate/i).first()).toBeVisible({ timeout: 60_000 });
  });
});
