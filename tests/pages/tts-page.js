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

  get scriptButton() {
    return this.root.getByRole("button", { name: /🇺🇸English|🇮🇳|Script/i }).first();
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

  async selectScript(scriptLabel) {
    const scriptButton = this.root
      .locator("text=Script")
      .locator("..")
      .getByRole("button")
      .first();
    if (await scriptButton.isVisible().catch(() => false)) {
      await scriptButton.click();
      await this.widgetPage.page.waitForTimeout(500);
    }

    const option = this.root.getByRole("button", {
      name: new RegExp(scriptLabel, "i"),
    });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().click();
    }
  }

  async selectVoice(voiceName) {
    const voiceButton = this.root
      .getByRole("button", { name: new RegExp(`${voiceName}`, "i") })
      .first();
    await voiceButton.scrollIntoViewIfNeeded();
    await voiceButton.click();
  }

  async setSpeed(speed) {
    const slider = this.root.locator("input[type='range']").first();
    if (await slider.isVisible().catch(() => false)) {
      await slider.fill(String(speed));
    }
  }

  async selectFormat(format) {
    const formatButton = this.root.getByRole("button", {
      name: new RegExp(`^${format}$`, "i"),
    });
    if (await formatButton.isVisible().catch(() => false)) {
      await formatButton.click();
      return;
    }

    const formatSelect = this.root.locator("main select").first();
    if (await formatSelect.isVisible().catch(() => false)) {
      await formatSelect.selectOption({ label: format });
    }
  }

  async selectExpressionStyle(style) {
    const styleButton = this.root.getByRole("button", {
      name: new RegExp(`^${style}$`, "i"),
    });
    if (await styleButton.isVisible().catch(() => false)) {
      await styleButton.click();
      return;
    }

    const styleSelect = this.root.locator("main select").nth(1);
    if (await styleSelect.isVisible().catch(() => false)) {
      await styleSelect.selectOption({ label: style });
    }
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
