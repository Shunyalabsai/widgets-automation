const { expect } = require("@playwright/test");

class SttPage {
  constructor(page) {
    this.page = page;
    this.playButton = page.getByRole("button", { name: /Play audio/i });
    this.pauseButton = page.getByRole("button", { name: /Pause audio/i });
    this.copyButton = page.getByRole("button", { name: /Copy Conversation/i });
    this.startSpeakingButton = page.getByRole("button", { name: /Start Speaking/i });
    this.stopSpeakingButton = page.getByRole("button", { name: /Stop/i });
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
    await this.page.waitForFunction(
      (minRows) =>
        document.querySelectorAll(".flex.items-center.space-x-2").length >=
        minRows,
      1,
      { timeout: timeoutMs },
    );
  }

  async waitForTranscriptLine({
    speakerText,
    timeText,
    contentText,
    speakerIndex = 0,
    timeoutMs = 90_000,
  }) {
    const speaker = this.page.getByText(speakerText).nth(speakerIndex);
    await expect(speaker).toBeVisible({ timeout: timeoutMs });
    await speaker.click();

    const time = this.page.getByText(timeText);
    await expect(time).toBeVisible({ timeout: timeoutMs });
    await time.click();

    const content = this.page.getByText(contentText);
    await expect(content).toBeVisible({ timeout: timeoutMs });
    await content.click();
  }

  async clickSpeakerLabels(timeoutMs = 90_000) {
    const speakerLabels = this.page.getByText(/Speaker\s*\d/i);
    await expect(speakerLabels).toHaveCount(2, { timeout: timeoutMs });
    await speakerLabels.first().click();
    await speakerLabels.nth(1).click();
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

  async startSpeaking() {
    await this.startSpeakingButton.click();
  }

  async stopSpeaking() {
    await this.stopSpeakingButton.click();
  }

  async waitForRecordingState(timeoutMs = 60_000) {
    await expect(this.page.getByText("RECORDING", { exact: true })).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async waitForProcessingState(timeoutMs = 120_000) {
    await expect(this.page.getByText("PROCESSING", { exact: true })).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async waitForTranscriptContains(expectedLines, timeoutMs = 180_000) {
    await this.page.waitForFunction(
      (lines) => {
        const rows = Array.from(
          document.querySelectorAll(".flex.items-center.space-x-2"),
        );
        const text = rows.map((row) => row.textContent || "").join(" ");
        return lines.every((line) => text.includes(line));
      },
      expectedLines,
      { timeout: timeoutMs },
    );
  }
}

module.exports = { SttPage };
