const { expect } = require("@playwright/test");

class SttPage {
  constructor(page) {
    this.page = page;
    this.playButton = page.getByRole("button", { name: /Play audio/i });
    this.pauseButton = page.getByRole("button", { name: /Pause audio/i });
    this.copyButton = page.getByRole("button", { name: /Copy Conversation/i });
    this.transcriptRows = page.locator(".flex.items-center.space-x-2");
    this.speakerLabels = page.getByText(/Speaker\s*\d/i);
    this.uploadButton = page.getByRole("button", { name: /Upload your file/i });
    this.asrPlayButton = page.locator("#ASR_Play_Btn");
    this.loaderIcon = page.locator(".lucide.lucide-loader-circle");
  }

  async selectPrerecordedOption(optionName) {
    await this.page
      .getByRole("button", { name: new RegExp(optionName, "i") })
      .click();
  }

  async play() {
    await this.playButton.click();
  }

  async waitForPlaybackToStart() {
    await this.pauseButton.waitFor();
  }

  async waitForTranscriptReady(timeoutMs = 90_000) {
    await this.transcriptRows.first().waitFor({ timeout: timeoutMs });
    await this.speakerLabels.first().waitFor({ timeout: timeoutMs });
  }

  async waitForTranscriptLine({
    speakerText,
    timeText,
    contentText,
    speakerIndex = 0,
    timeoutMs = 90_000,
  }) {
    const speaker = this.page.getByText(speakerText).nth(speakerIndex);
    await speaker.waitFor({ timeout: timeoutMs });
    await speaker.click();

    const time = this.page.getByText(timeText);
    await time.waitFor({ timeout: timeoutMs });
    await time.click();

    const content = this.page.getByText(contentText);
    await content.waitFor({ timeout: timeoutMs });
    await content.click();
  }

  async clickSpeakerLabels() {
    await this.page.getByText(/Speaker\s*1/i).click();
    await this.page.getByText(/Speaker\s*2/i).click();
  }

  async clickFirstTranscriptRow() {
    await this.transcriptRows.first().click();
  }

  async assertCopyAvailable() {
    await expect(this.copyButton).toBeEnabled();
  }

  async copyConversation() {
    await this.copyButton.waitFor();
    await this.copyButton.click();
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

  async waitForUploadProcessing(timeoutMs = 120_000) {
    await this.loaderIcon.first().waitFor({ timeout: timeoutMs });
    await this.loaderIcon.first().waitFor({ state: "hidden", timeout: timeoutMs });
  }

  async playUploadedAudio() {
    await this.asrPlayButton.click();
  }
}

module.exports = { SttPage };
