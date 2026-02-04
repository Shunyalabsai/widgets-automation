const { expect } = require("@playwright/test");

class CodeswitchPage {
  constructor(page) {
    this.page = page;
    this.uploadButton = page.getByRole("button", { name: /Upload your file/i });
    this.copyButton = page.getByRole("button", { name: /Copy Conversation/i });
  }

  async uploadAudioFile(filePath) {
    const fileInput = this.page.locator("input[type='file']");
    if (await fileInput.count()) {
      await fileInput.first().setInputFiles(filePath);
      return;
    }

    const [fileChooser] = await Promise.all([
      this.page.waitForEvent("filechooser"),
      this.uploadButton.click(),
    ]);
    await fileChooser.setFiles(filePath);
  }

  async waitForProcessingState(timeoutMs = 120_000) {
    await expect(this.page.getByText("PROCESSING", { exact: true })).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async waitForTranscriptSnippet(snippet, timeoutMs = 180_000) {
    await expect(this.page.getByText(snippet)).toBeVisible({ timeout: timeoutMs });
  }

  async waitForSpeakerLabel(label, timeoutMs = 120_000) {
    await expect(this.page.getByText(label)).toBeVisible({ timeout: timeoutMs });
  }

  async assertCopyAvailable() {
    await expect(this.copyButton).toBeEnabled();
  }
}

module.exports = { CodeswitchPage };
