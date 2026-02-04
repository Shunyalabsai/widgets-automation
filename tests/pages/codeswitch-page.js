const { expect } = require("@playwright/test");

class CodeswitchPage {
  constructor(page) {
    this.page = page;
    this.playButton = page.getByRole("button", { name: /Play audio/i });
    this.uploadButton = page.getByRole("button", { name: /Upload your file/i });
    this.copyButton = page.getByRole("button", { name: /Copy Conversation/i });
  }

  async selectSampleAudio() {
    await this.page.getByRole("button", { name: /Sample Audio/i }).click();
  }

  async playSampleAudio() {
    await this.playButton.click();
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

  async waitForTranscriptSnippetNormalized(snippet, timeoutMs = 180_000) {
    await this.page.waitForFunction(
      (expected) => {
        const rows = Array.from(
          document.querySelectorAll(".flex.items-center.space-x-2"),
        );
        const normalize = (value) =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9\s\u0900-\u097f]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const text = normalize(rows.map((row) => row.textContent || "").join(" "));
        return text.includes(normalize(expected));
      },
      snippet,
      { timeout: timeoutMs },
    );
  }

  async waitForTranscriptRows(timeoutMs = 180_000) {
    await this.page.waitForFunction(
      () =>
        document.querySelectorAll(".flex.items-center.space-x-2").length > 0,
      null,
      { timeout: timeoutMs },
    );
  }

  async waitForSpeakerLabel(label, timeoutMs = 120_000) {
    await expect(this.page.getByText(label)).toBeVisible({ timeout: timeoutMs });
  }

  async assertCopyAvailable() {
    await expect(this.copyButton).toBeEnabled();
  }
}

module.exports = { CodeswitchPage };
