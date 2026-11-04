const { expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { HOME_DEMO_TABS } = require("../config/live-products");
const { gotoSite } = require("../utils/site-helpers");

class ShunyaSitePage {
  constructor(page) {
    this.page = page;
    this.env = getEnvironment();
  }

  async openHome() {
    await gotoSite(this.page, this.env.siteUrl);
    await this.page.getByRole("heading", { name: /Ask it something/i }).waitFor({ timeout: 60_000 });
    await this.page
      .evaluate(() => {
        document.querySelector("#sl-hero")?.classList.remove("opening");
      })
      .catch(() => {});
  }

  demoRegion() {
    return this.page.getByRole("region", { name: /Ask it something/i });
  }

  async openAskItSomethingTab(namePattern) {
    const region = this.demoRegion();
    const tab = region.getByRole("tab", { name: namePattern });
    await tab.waitFor({ state: "visible", timeout: 60_000 });
    await tab.scrollIntoViewIfNeeded();
    for (let attempt = 0; attempt < 3; attempt++) {
      await tab.click({ force: true });
      if ((await tab.getAttribute("aria-selected")) === "true") break;
      await this.page.waitForTimeout(500);
    }
    await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 10_000 });
    const panelId = await tab.getAttribute("aria-controls");
    if (panelId && (await this.page.locator(`#${panelId}`).count()) > 0) {
      return this.page.locator(`#${panelId}`);
    }
    const panel = region.locator('[role="tabpanel"]').filter({ hasNot: this.page.locator("[hidden]") }).first();
    await panel.waitFor({ state: "visible", timeout: 60_000 });
    return panel;
  }

  homeDemoTabs() {
    return { ...HOME_DEMO_TABS };
  }
}

module.exports = { ShunyaSitePage };
