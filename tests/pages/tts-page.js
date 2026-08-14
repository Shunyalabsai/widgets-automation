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
    return this.root.getByRole("button", { name: /Generate Speech|^Generate$/i });
  }

  get scriptButton() {
    return this.root.getByRole("button", { name: /🇺🇸English|🇮🇳|Script/i }).first();
  }

  get languageDropdown() {
    return this.root.getByRole("button", { name: /English|Hindi|Tamil/i }).first();
  }

  async enterText(text) {
    await this.textInput.fill(text);
    await this.textInput.blur().catch(() => {});
  }

  async clearText() {
    await this.textInput.fill("");
  }

  async getCharCount() {
    const countText = await this.root.getByText(/\d+\s*\/\s*1000/).textContent();
    return parseInt(countText.match(/(\d+)/)?.[1] || "0", 10);
  }

  async openOptionMenu(currentLabelPattern) {
    const trigger = this.root
      .getByRole("button", { name: currentLabelPattern })
      .first();
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
      await this.widgetPage.page.waitForTimeout(300);
    }
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
      .getByRole("button", { name: new RegExp(voiceName, "i") })
      .first();
    await voiceButton.scrollIntoViewIfNeeded();
    await voiceButton.click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async setSpeed(speed) {
    const slider = this.root.locator("input[type='range']").first();
    if (await slider.isVisible().catch(() => false)) {
      await slider.fill(String(speed));
    }
  }

  async selectFormat(format) {
    await this.openOptionMenu(/^(MP3|WAV|OGG|FLAC)/i);

    const option = this.root.getByRole("button", {
      name: new RegExp(`^${format}`, "i"),
    });
    if (await option.first().isVisible().catch(() => false)) {
      await option.first().click();
      return;
    }

    const formatSelect = this.root.locator("main select").first();
    if (await formatSelect.isVisible().catch(() => false)) {
      await formatSelect.selectOption({ label: new RegExp(format, "i") });
    }
  }

  async selectExpressionStyle(style) {
    await this.openOptionMenu(/^(Neutral|Happy|Sad|Conversational)/i);

    const styleButton = this.root.getByRole("button", {
      name: new RegExp(`^${style}$`, "i"),
    });
    if (await styleButton.first().isVisible().catch(() => false)) {
      await styleButton.first().click();
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
    if ((await this.generateButton.count()) > 0) {
      await this.generateButton.first().click();
      return;
    }

    await this.textInput.blur().catch(() => {});
  }

  async waitForAudioGenerated(timeoutMs = 60_000) {
    await this.root.locator("audio").first().waitFor({
      state: "attached",
      timeout: timeoutMs,
    });
    await this.root
      .getByRole("button", { name: /^Play$/i })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
  }

  async waitForGenerateEnabled(timeoutMs = 30_000) {
    if ((await this.generateButton.count()) > 0) {
      await expect(this.generateButton.first()).toBeEnabled({ timeout: timeoutMs });
      return;
    }

    await this.waitForAudioGenerated(timeoutMs);
  }

  async waitForProcessing(timeoutMs = TIMEOUTS.TTS_PROCESSING) {
    if ((await this.generateButton.count()) > 0) {
      try {
        await expect(this.generateButton.first()).toBeDisabled({ timeout: 5_000 });
      } catch {
        // May already be done
      }
      await expect(this.generateButton.first()).toBeEnabled({ timeout: timeoutMs });
      return;
    }

    await this.waitForAudioGenerated(timeoutMs);
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
