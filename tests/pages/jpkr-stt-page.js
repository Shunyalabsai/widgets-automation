const { expect } = require("@playwright/test");
const { SttPage } = require("./stt-page");

class JpKrSttPage extends SttPage {
  get languageButton() {
    return this.root.getByRole("button", { name: /Japanese|Korean/i }).first();
  }

  async openLanguageMenu() {
    await this.languageButton.click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async selectLanguage(languageName) {
    await this.openLanguageMenu();
    await this.root
      .getByRole("button", { name: new RegExp(languageName, "i") })
      .last()
      .click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async assertLanguageVisible(languageName, timeoutMs = 10_000) {
    await expect(this.root.getByText(new RegExp(languageName, "i")).first()).toBeVisible({
      timeout: timeoutMs,
    });
  }
}

module.exports = { JpKrSttPage };
