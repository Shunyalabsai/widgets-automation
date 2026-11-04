const { getEnvironment } = require("../config/environment");

class PlaygroundPage {
  constructor(page) {
    this.page = page;
    this.env = getEnvironment();
  }

  playgroundPath(segment) {
    const base = this.env.playgroundUrl.replace(/\/$/, "");
    return `${base}/${segment}`;
  }

  async openListenHorizon() {
    await this.page.goto(this.playgroundPath("listen"), { waitUntil: "domcontentloaded" });
    await this.page.waitForURL(/\/playground\/listen/, { timeout: 60_000 });
    await this.mainWorkspace()
      .getByRole("button", { name: /RECORD|TRANSCRIBE A SAMPLE|UPLOAD A FILE/i })
      .first()
      .waitFor({ state: "visible", timeout: 60_000 });
  }

  async openSpeakRadiance() {
    await this.page.goto(this.playgroundPath("speak"), { waitUntil: "domcontentloaded" });
    await this.page.waitForURL(/\/playground\/speak/, { timeout: 60_000 });
    await this.mainWorkspace()
      .locator("textarea, input[type='text']")
      .first()
      .waitFor({ state: "visible", timeout: 60_000 });
  }

  async openTranslateParallax() {
    await this.page.goto(this.playgroundPath("translate"), { waitUntil: "domcontentloaded" });
    await this.page.waitForURL(/\/playground\/translate/, { timeout: 60_000 });
    await this.mainWorkspace()
      .getByRole("button", { name: /RECORD|UPLOAD|TRANSCRIBE|SAMPLE/i })
      .first()
      .waitFor({ state: "visible", timeout: 60_000 });
  }

  mainWorkspace() {
    return this.page.locator("main").first();
  }
}

module.exports = { PlaygroundPage };
