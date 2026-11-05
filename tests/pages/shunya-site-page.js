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
    await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 15_000 });
    const panelId = await tab.getAttribute("aria-controls");
    const panelTimeout = process.env.CI ? 90_000 : 60_000;
    let panel;
    if (panelId && (await this.page.locator(`#${panelId}`).count()) > 0) {
      panel = this.page.locator(`#${panelId}`);
    } else {
      panel = region
        .locator('[role="tabpanel"]')
        .filter({ hasNot: this.page.locator("[hidden]") })
        .first();
    }
    await panel.waitFor({ state: "visible", timeout: panelTimeout });
    await panel
      .locator('[aria-busy="true"]')
      .waitFor({ state: "detached", timeout: 20_000 })
      .catch(() => {});
    return panel;
  }

  listenDemoControls(panel) {
    return panel.getByRole("button", {
      name: /RECORD|TRY A SAMPLE|TRANSCRIBE A SAMPLE|UPLOAD A FILE/i,
    });
  }

  async waitForHomeDemoReady(panel, kind) {
    const timeout = process.env.CI ? 120_000 : 90_000;
    switch (kind) {
      case "listen": {
        const byRole = this.listenDemoControls(panel).first();
        try {
          await byRole.waitFor({ state: "visible", timeout });
          return;
        } catch {
          await panel
            .getByText(/RECORD|TRY A SAMPLE|TRANSCRIBE A SAMPLE|UPLOAD A FILE/i)
            .first()
            .waitFor({ state: "visible", timeout: 30_000 });
        }
        return;
      }
      case "speak":
        await panel.locator("textarea").first().waitFor({ state: "visible", timeout });
        await expect(panel).toContainText(/Radiance|text to speech/i, { timeout: 20_000 });
        return;
      case "translate":
        await expect(panel).toContainText(/Parallax|speech to speech/i, { timeout });
        await panel
          .getByText(/Parallax|speech to speech/i)
          .first()
          .waitFor({ state: "visible", timeout: 20_000 });
        return;
      case "resonance":
        await expect(panel).toContainText(/Resonance|voice agent/i, { timeout });
        return;
      default:
        throw new Error(`Unknown home demo kind: ${kind}`);
    }
  }

  homeDemoTabs() {
    return { ...HOME_DEMO_TABS };
  }
}

module.exports = { ShunyaSitePage };
