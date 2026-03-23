const { expect } = require("@playwright/test");

class TtsPage {
  constructor(page) {
    this.page = page;
    this.textInput = page.locator("textarea[placeholder*='Type or paste']");
    this.generateButton = page.getByRole("button", { name: /Generate Speech/i });
    this.languageDropdown = page.getByRole("button", { name: /English|Hindi|Tamil/i }).first();
  }

  async enterText(text) {
    await this.textInput.fill(text);
  }

  async clearText() {
    await this.textInput.fill("");
  }

  async getCharCount() {
    const countText = await this.page.getByText(/\d+\s*\/\s*1000/).textContent();
    return parseInt(countText.match(/(\d+)/)?.[1] || "0", 10);
  }

  async selectVoice(voiceName) {
    await this.page.getByRole("button", { name: new RegExp(voiceName, "i") }).click();
  }

  async setSpeed(speed) {
    const slider = this.page.locator("input[type='range']").first();
    if (await slider.isVisible()) {
      const min = parseFloat(await slider.getAttribute("min") || "0.25");
      const max = parseFloat(await slider.getAttribute("max") || "4");
      const step = parseFloat(await slider.getAttribute("step") || "0.25");
      await slider.fill(String(speed));
    }
  }

  async selectFormat(format) {
    const formatSelect = this.page.locator("main select").first();
    await formatSelect.selectOption({ label: format });
  }

  async selectExpressionStyle(style) {
    const styleSelect = this.page.locator("main select").nth(1);
    await styleSelect.selectOption({ label: style });
  }

  async toggleTrimSilence() {
    await this.page.getByText(/Trim Silence/i).click();
  }

  async generate() {
    await this.generateButton.click();
  }

  async waitForAudioGenerated(timeoutMs = 60_000) {
    // Wait for audio player or download button to appear after generation
    await this.page.locator("audio, [data-testid='audio-player'], button:has-text('Download'), .audio-player").first().waitFor({
      state: "visible",
      timeout: timeoutMs,
    });
  }

  async waitForGenerateEnabled(timeoutMs = 30_000) {
    await expect(this.generateButton).toBeEnabled({ timeout: timeoutMs });
  }

  async waitForProcessing(timeoutMs = 60_000) {
    // Wait for generate button to become disabled (processing) then re-enabled (done)
    try {
      await expect(this.generateButton).toBeDisabled({ timeout: 5_000 });
    } catch {
      // May already be done
    }
    await expect(this.generateButton).toBeEnabled({ timeout: timeoutMs });
  }

  async isAudioPlayerVisible() {
    return await this.page.locator("audio, [data-testid='audio-player'], .audio-player").first().isVisible().catch(() => false);
  }
}

module.exports = { TtsPage };
