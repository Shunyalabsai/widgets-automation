const { test, expect } = require("@playwright/test");
const { ShunyaSitePage } = require("../pages/shunya-site-page");

test.describe("[Site] Homepage live demos", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async ({ page }) => {
    const site = new ShunyaSitePage(page);
    await site.openHome();
  });

  test("Listen (Horizon) tab is interactive", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().listen);
    await expect(panel.getByText(/^RECORD$|^TRY A SAMPLE$|^UPLOAD A FILE$/i).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test("Speak (Radiance) tab is interactive", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().speak);
    await expect(panel.locator("textarea").first()).toBeVisible({ timeout: 60_000 });
    await expect(panel).toContainText(/Radiance|text to speech/i);
  });

  test("Translate (Parallax) tab is interactive", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().translate);
    await expect(panel).toContainText(/Parallax|speech to speech/i);
    await expect(panel.getByText(/Parallax|speech to speech/i).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test("Resonance tab opens voice agent entry", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().resonance);
    await expect(panel).toContainText(/Resonance|voice agent/i);
  });
});
