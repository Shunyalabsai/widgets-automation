const { expect } = require("@playwright/test");
const { getEnvironment } = require("../config/environment");
const { HOME_DEMO_TABS } = require("../config/live-products");
const { gotoSite } = require("../utils/site-helpers");

const DEMO_INPUT_SELECTOR =
  "textarea, [contenteditable='true'], [role='textbox'], input[type='text']";

class ShunyaSitePage {
  constructor(page) {
    this.page = page;
    this.env = getEnvironment();
  }

  demoReadyTimeoutMs() {
    return process.env.CI ? 150_000 : 90_000;
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
    for (let attempt = 0; attempt < 5; attempt++) {
      await tab.click({ force: true });
      await this.page.waitForTimeout(400);
      if ((await tab.getAttribute("aria-selected")) === "true") break;
      await tab.focus();
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(400);
      if ((await tab.getAttribute("aria-selected")) === "true") break;
    }
    await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 20_000 });
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
      .waitFor({ state: "detached", timeout: 30_000 })
      .catch(() => {});
    return panel;
  }

  async openAskItSomethingTabWithRetry(namePattern, { retries = process.env.CI ? 2 : 1 } = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          await this.openHome();
        }
        return await this.openAskItSomethingTab(namePattern);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  listenDemoControls(panel) {
    return panel.getByRole("button", {
      name: /RECORD|TRY A SAMPLE|TRANSCRIBE A SAMPLE|UPLOAD A FILE/i,
    });
  }

  async panelHasVisibleInput(panel) {
    const direct = panel.locator(DEMO_INPUT_SELECTOR).first();
    if (await direct.isVisible().catch(() => false)) return true;

    const iframeCount = await panel.locator("iframe").count();
    if (iframeCount === 0) return false;

    const frame = panel.frameLocator("iframe").first();
    return frame.locator(`${DEMO_INPUT_SELECTOR}, button`).first().isVisible().catch(() => false);
  }

  async waitForPanelInteractiveInput(panel, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.panelHasVisibleInput(panel)) return;

      const productError = panel.getByText(/something went wrong|please try again|failed to load/i);
      if (await productError.isVisible().catch(() => false)) {
        throw new Error("Homepage demo showed a product error banner");
      }

      await this.page.waitForTimeout(750);
    }
    throw new Error(`Demo input not visible within ${timeoutMs}ms`);
  }

  async waitForHomeDemoReady(panel, kind) {
    const timeout = this.demoReadyTimeoutMs();
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
            .waitFor({ state: "visible", timeout: 45_000 });
        }
        return;
      }
      case "speak":
        await this.waitForPanelInteractiveInput(panel, timeout);
        await expect(panel).toContainText(/Radiance|text to speech|Type or paste|Enter text/i, {
          timeout: 25_000,
        });
        return;
      case "translate":
        await expect(panel).toContainText(/Parallax|speech to speech/i, { timeout });
        await panel
          .getByText(/Parallax|speech to speech/i)
          .first()
          .waitFor({ state: "visible", timeout: 25_000 });
        await this.waitForPanelInteractiveInput(panel, 45_000).catch(() => {});
        return;
      case "resonance":
        await expect(panel).toContainText(/Resonance|voice agent|Talk to Meera/i, { timeout });
        await panel
          .getByRole("button", { name: /Talk to Meera/i })
          .first()
          .waitFor({ state: "visible", timeout: 45_000 });
        await panel
          .getByPlaceholder(/enter your number|phone/i)
          .or(panel.locator("input[type='tel'], input[inputmode='tel']").first())
          .first()
          .waitFor({ state: "visible", timeout: 45_000 });
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
