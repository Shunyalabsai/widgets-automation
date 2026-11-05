const { test, expect } = require("@playwright/test");
const { ShunyaSitePage } = require("../pages/shunya-site-page");

test.describe("[Site] Homepage live demos", () => {
  test.beforeEach(async ({ page }) => {
    const site = new ShunyaSitePage(page);
    await site.openHome();
  });

  test("Listen (Horizon) tab is interactive", async ({ page }) => {
    test.setTimeout(process.env.CI ? 240_000 : 180_000);
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().listen);
    await site.waitForHomeDemoReady(panel, "listen");
    await expect(site.listenDemoControls(panel).first()).toBeVisible();
  });

  test("Speak (Radiance) tab is interactive", async ({ page }) => {
    test.setTimeout(process.env.CI ? 240_000 : 180_000);
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().speak);
    await site.waitForHomeDemoReady(panel, "speak");
  });

  test("Translate (Parallax) tab is interactive", async ({ page }) => {
    test.setTimeout(process.env.CI ? 240_000 : 180_000);
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().translate);
    await site.waitForHomeDemoReady(panel, "translate");
  });

  test("Resonance tab opens voice agent entry", async ({ page }) => {
    test.setTimeout(process.env.CI ? 240_000 : 180_000);
    const site = new ShunyaSitePage(page);
    const panel = await site.openAskItSomethingTab(site.homeDemoTabs().resonance);
    await site.waitForHomeDemoReady(panel, "resonance");
  });
});
