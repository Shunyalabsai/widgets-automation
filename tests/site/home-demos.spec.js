const { test, expect } = require("@playwright/test");
const { ShunyaSitePage } = require("../pages/shunya-site-page");

test.describe("[Site] Homepage live demos", () => {
  test.beforeEach(async ({ page }) => {
    const site = new ShunyaSitePage(page);
    await site.openHome();
  });

  test("Listen (Horizon) tab is interactive", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const tabs = site.homeDemoTabs();
    await site.openAskItSomethingTab(tabs.listen);
    const panel = site.activeDemoPanel(tabs.listen);
    await expect(panel.getByRole("button", { name: /Record|Upload|Try a sample/i }).first()).toBeVisible();
  });

  test("Speak (Radiance) tab is interactive", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const pattern = site.homeDemoTabs().speak;
    await site.openAskItSomethingTab(pattern);
    const panel = site.activeDemoPanel(pattern);
    await expect(panel.getByRole("button").first()).toBeVisible();
    await expect(panel).toContainText(/Radiance|text to speech/i);
  });

  test("Translate (Parallax) tab is interactive", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const pattern = site.homeDemoTabs().translate;
    await site.openAskItSomethingTab(pattern);
    const panel = site.activeDemoPanel(pattern);
    await expect(panel).toContainText(/Parallax|speech to speech/i);
  });

  test("Resonance tab opens voice agent entry", async ({ page }) => {
    const site = new ShunyaSitePage(page);
    const pattern = site.homeDemoTabs().resonance;
    await site.openAskItSomethingTab(pattern);
    const panel = site.activeDemoPanel(pattern);
    await expect(panel).toContainText(/Resonance|voice agent/i);
  });
});
