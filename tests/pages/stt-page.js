const { expect } = require("@playwright/test");
const { TIMEOUTS } = require("../utils/timeouts");

class SttPage {
  constructor(widgetPage) {
    this.widgetPage = widgetPage;
  }

  get root() {
    return this.widgetPage.getWidgetRoot();
  }

  get playButton() {
    return this.root.getByRole("button", { name: /Play audio/i });
  }

  get pauseButton() {
    return this.root.getByRole("button", { name: /Pause audio/i });
  }

  get copyButton() {
    return this.root.getByRole("button", { name: /Copy Conversation/i });
  }

  get startSpeakingButton() {
    return this.root.getByRole("button", { name: /Start Speaking/i });
  }

  get stopSpeakingButton() {
    return this.root.getByRole("button", { name: /Stop/i });
  }

  get transcriptRows() {
    return this.root.locator(".flex.items-center.space-x-2");
  }

  get speakerLabels() {
    return this.root.getByText(/Speaker\s*\d/i);
  }

  get uploadButton() {
    return this.root.getByRole("button", { name: /Upload your file/i });
  }

  get asrPlayButton() {
    return this.root.locator("#ASR_Play_Btn");
  }

  get loaderIcon() {
    return this.root.locator(".lucide.lucide-loader-circle");
  }

  async selectPrerecordedOption(optionName) {
    await this.root
      .getByRole("button", { name: new RegExp(optionName, "i") })
      .click();
  }

  async play() {
    await this.playButton.click();
  }

  async waitForPlaybackToStart() {
    await this.pauseButton.waitFor();
  }

  async waitForTranscriptReady(timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.root.waitForFunction(
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
    const speaker = this.root.getByText(speakerText).nth(speakerIndex);
    await expect(speaker).toBeVisible({ timeout: timeoutMs });
    await speaker.click();

    if (timeText) {
      const time = this.root.getByText(timeText);
      await expect(time).toBeVisible({ timeout: timeoutMs });
      await time.click();
    }

    const content = this.root.getByText(contentText);
    await expect(content).toBeVisible({ timeout: timeoutMs });
    await content.click();
  }

  async clickSpeakerLabels(timeoutMs = 90_000) {
    const speakerLabels = this.root.getByText(/Speaker\s*\d/i);
    await expect(speakerLabels).toHaveCount(2, { timeout: timeoutMs });
    await speakerLabels.first().click();
    await speakerLabels.nth(1).click();
  }

  async waitForAnySpeakerLabel(timeoutMs = 90_000) {
    await expect(this.root.getByText(/Speaker\s*\d/i).first()).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async clickFirstTranscriptRow() {
    await this.transcriptRows.first().click();
  }

  async assertCopyAvailable() {
    await expect(this.copyButton).toBeEnabled();
  }

  async copyConversation() {
    for (let attempt = 0; attempt < 3; attempt++) {
      const button = this.copyButton;
      await button.waitFor({ state: "visible", timeout: 30_000 });
      try {
        await button.click({ timeout: 10_000 });
        return;
      } catch (error) {
        if (attempt === 2) throw error;
        await this.widgetPage.page.waitForTimeout(1000);
      }
    }
  }

  async uploadAudioFile(filePath) {
    const fileInput = this.root.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles(filePath);
      return;
    }

    const [fileChooser] = await Promise.all([
      this.widgetPage.page.waitForEvent("filechooser"),
      this.uploadButton.click(),
    ]);
    await fileChooser.setFiles(filePath);
  }

  async waitForUploadResult(timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    const failed = this.root.getByText("Upload failed");
    const speaker = this.root.getByText(/Speaker\s*\d/i).first();

    await Promise.race([
      speaker.waitFor({ state: "visible", timeout: timeoutMs }),
      failed.waitFor({ state: "visible", timeout: timeoutMs }).then(async () => {
        const message = await this.root
          .getByText(/Something went wrong|Please try again/i)
          .first()
          .textContent()
          .catch(() => "");
        throw new Error(
          `Upload failed in widget${message ? `: ${message.trim()}` : ""}`,
        );
      }),
    ]);
  }

  async waitForUploadProcessing(timeoutMs = TIMEOUTS.UPLOAD_PROCESSING) {
    try {
      await this.loaderIcon.first().waitFor({ timeout: 15_000 });
      await this.loaderIcon.first().waitFor({ state: "hidden", timeout: timeoutMs });
    } catch {
      // Loader may have appeared and disappeared before we checked — continue
    }
  }

  async playUploadedAudio() {
    await this.playButton.click();
  }

  async startSpeaking() {
    await this.startSpeakingButton.click();
  }

  async stopSpeaking() {
    await this.stopSpeakingButton.click();
  }

  async waitForRecordingState(timeoutMs = 15_000) {
    await expect(this.root.getByText("RECORDING", { exact: true })).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async waitForProcessingState(timeoutMs = 120_000) {
    await expect(this.root.getByText("PROCESSING", { exact: true })).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async tryWaitForProcessingState(timeoutMs = 30_000) {
    try {
      await this.waitForProcessingState(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  async tryWaitForRecordingState(timeoutMs = 10_000) {
    try {
      await this.waitForRecordingState(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  async tryStopSpeaking() {
    if (await this.stopSpeakingButton.isVisible()) {
      await this.stopSpeakingButton.click();
      return true;
    }
    return false;
  }

  async waitForTranscriptContains(expectedLines, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.root.waitForFunction(
      (lines) => {
        const rows = Array.from(
          document.querySelectorAll(".flex.items-center.space-x-2"),
        );
        const normalize = (value) =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const text = normalize(rows.map((row) => row.textContent || "").join(" "));
        return lines.every((line) => text.includes(normalize(line)));
      },
      expectedLines,
      { timeout: timeoutMs },
    );
  }

  async waitForTranscriptSummary({
    keyPhrases,
    speakerCount,
    timeoutMs = TIMEOUTS.BACKEND_RESULT,
  }) {
    await this.root.waitForFunction(
      (params) => {
        const rows = Array.from(
          document.querySelectorAll(".flex.items-center.space-x-2"),
        );
        const normalize = (value) =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const text = normalize(rows.map((row) => row.textContent || "").join(" "));
        const speakers = new Set();
        rows.forEach((row) => {
          const match = (row.textContent || "").match(/Speaker\s*\d/gi);
          if (match) match.forEach((item) => speakers.add(item.toLowerCase()));
        });
        const phrasesOk = params.keyPhrases.every((line) =>
          text.includes(normalize(line)),
        );
        const speakersOk = params.speakerCount
          ? speakers.size === params.speakerCount
          : speakers.size > 0;
        return phrasesOk && speakersOk;
      },
      { keyPhrases, speakerCount },
      { timeout: timeoutMs },
    );
  }
}

module.exports = { SttPage };
