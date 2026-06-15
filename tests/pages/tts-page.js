const { expect } = require("@playwright/test");
const { TIMEOUTS } = require("../utils/timeouts");

class TtsPage {
  constructor(widgetPage) {
    this.widgetPage = widgetPage;
  }

  get root() {
    return this.widgetPage.getWidgetRoot();
  }

  get textInput() {
    return this.root.locator(
      "textarea[placeholder*='Type or paste'], textarea[placeholder*='Ready to hear']",
    );
  }

  get generateButton() {
    return this.root.getByRole("button", { name: /Generate Speech/i });
  }

  get languageDropdown() {
    return this.root.getByRole("button", { name: /English|Hindi|Tamil/i }).first();
  }

  async enterText(text) {
    await this.textInput.fill(text);
  }

  async clearText() {
    await this.textInput.fill("");
  }

  async getCharCount() {
    const countText = await this.root.getByText(/\d+\s*\/\s*1000/).textContent();
    return parseInt(countText.match(/(\d+)/)?.[1] || "0", 10);
  }

  async selectVoice(voiceName) {
    await this.root.getByRole("button", { name: new RegExp(voiceName, "i") }).click();
  }

  async setSpeed(speed) {
    const slider = this.root.locator("input[type='range']").first();
    if (await slider.isVisible()) {
      await slider.fill(String(speed));
    }
  }

  async selectFormat(format) {
    const formatSelect = this.root.locator("main select").first();
    await formatSelect.selectOption({ label: format });
  }

  async selectExpressionStyle(style) {
    const styleSelect = this.root.locator("main select").nth(1);
    await styleSelect.selectOption({ label: style });
  }

  async toggleTrimSilence() {
    await this.root.getByText(/Trim Silence/i).click();
  }

  async generate() {
    await this.generateButton.click();
  }

  async waitForAudioGenerated(timeoutMs = 60_000) {
    await this.root
      .locator(
        "audio, [data-testid='audio-player'], button:has-text('Download'), .audio-player",
      )
      .first()
      .waitFor({
        state: "visible",
        timeout: timeoutMs,
      });
  }

  async waitForGenerateEnabled(timeoutMs = 30_000) {
    await expect(this.generateButton).toBeEnabled({ timeout: timeoutMs });
  }

  async waitForProcessing(timeoutMs = TIMEOUTS.TTS_PROCESSING) {
    try {
      await expect(this.generateButton).toBeDisabled({ timeout: 5_000 });
    } catch {
      // May already be done
    }
    await expect(this.generateButton).toBeEnabled({ timeout: timeoutMs });
  }

  async isAudioPlayerVisible() {
    return await this.root
      .locator("audio, [data-testid='audio-player'], .audio-player")
      .first()
      .isVisible()
      .catch(() => false);
  }
}

module.exports = { TtsPage };
