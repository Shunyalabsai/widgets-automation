const { getEnvironment } = require("../config/environment");
const { gotoSite } = require("../utils/site-helpers");

class ShunyaSitePage {
  constructor(page) {
    this.page = page;
    this.env = getEnvironment();
  }

  async openHome() {
    await gotoSite(this.page, this.env.siteUrl);
    await this.page.getByRole("heading", { name: /Ask it something/i }).waitFor({ timeout: 60_000 });
  }

  demoRegion() {
    return this.page.getByRole("region", { name: /Ask it something/i });
  }

  async openAskItSomethingTab(namePattern) {
    const region = this.demoRegion();
    const tab = region.getByRole("tab", { name: namePattern });
    await tab.waitFor({ state: "visible", timeout: 60_000 });
    await tab.click();
    await region.getByRole("tabpanel", { name: namePattern }).waitFor({ state: "visible", timeout: 30_000 });
  }

  activeDemoPanel(namePattern) {
    return this.demoRegion().getByRole("tabpanel", { name: namePattern });
  }

  homeDemoTabs() {
    return {
      listen: /Listen.*Horizon/i,
      speak: /Speak.*Radiance/i,
      translate: /Translate.*Parallax/i,
      resonance: /Resonance.*voice agent/i,
      knowledge: /Ask the knowledge.*Accretion/i,
      understanding: /conversation that holds/i,
    };
  }
}

module.exports = { ShunyaSitePage };
