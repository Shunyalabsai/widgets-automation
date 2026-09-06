const { expect } = require("@playwright/test");
const { TIMEOUTS } = require("../utils/timeouts");
const {
  transcriptHasMeaningfulContent,
  transcriptHasPhrases,
} = require("../utils/transcript-text");

class SttPage {
  constructor(widgetPage) {
    this.widgetPage = widgetPage;
  }

  get root() {
    return this.widgetPage.getWidgetRoot();
  }

  get playButton() {
    return this.root.getByRole("button", { name: /^Play$/i });
  }

  get pauseButton() {
    return this.root.getByRole("button", { name: /^Pause$/i });
  }

  get copyButton() {
    return this.root.getByRole("button", { name: /Copy text|Copy Conversation/i });
  }

  get startSpeakingButton() {
    return this.root.getByRole("button", { name: /Start recording|Start Speaking/i });
  }

  get stopSpeakingButton() {
    return this.root.getByRole("button", { name: /Stop recording|^Stop$/i });
  }

  get transcriptRows() {
    return this.root.locator(".flex.items-center.space-x-2");
  }

  get speakerLabels() {
    return this.root.getByText(/Speaker\s*\d/i);
  }

  get uploadButton() {
    return this.root.getByRole("tab", { name: /Upload file/i });
  }

  get sampleClipsTab() {
    return this.root.getByRole("tab", { name: /Sample clips/i });
  }

  get recordLiveTab() {
    return this.root.getByRole("tab", { name: /Record live/i });
  }

  async ensureSampleClipsMode() {
    const tab = this.sampleClipsTab;
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
    }
    await this.widgetPage.page.waitForTimeout(500);
  }

  async ensureUploadMode() {
    const tab = this.uploadButton;
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
    }
    await this.widgetPage.page.waitForTimeout(500);
  }

  async ensureRecordLiveMode() {
    const tab = this.recordLiveTab;
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
    }
    await this.widgetPage.page.waitForTimeout(500);
  }

  get asrPlayButton() {
    return this.root.locator("#ASR_Play_Btn");
  }

  get loaderIcon() {
    return this.root.locator(".lucide.lucide-loader-circle");
  }

  async selectPrerecordedOption(optionName) {
    await this.ensureSampleClipsMode();
    await this.root
      .getByRole("button", { name: new RegExp(optionName, "i") })
      .click();
  }

  async play() {
    await this.playButton.click();
  }

  async waitForPlaybackToStart() {
    await this.pauseButton.waitFor({ timeout: 60_000 });
  }

  async waitForTranscriptReady(timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.root.waitForFunction(transcriptHasMeaningfulContent, 120, {
      timeout: timeoutMs,
    });
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
    await expect(this.copyButton).toBeEnabled({ timeout: 60_000 });
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
    await this.ensureUploadMode();

    const fileInput = this.root.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles(filePath);
      return;
    }

    const [fileChooser] = await Promise.all([
      this.widgetPage.page.waitForEvent("filechooser"),
      this.root.locator('input[type="file"]').click({ force: true }).catch(() =>
        this.root.getByText(/Upload|Drag|Choose/i).first().click(),
      ),
    ]);
    await fileChooser.setFiles(filePath);
  }

  async waitForUploadResult(timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    const failed = this.root.getByText(/Upload failed|Something went wrong/i);
    const speaker = this.root.getByText(/Speaker\s*\d/i).first();
    const transcriptRow = this.root.locator(".flex.items-center.space-x-2").first();

    await Promise.race([
      speaker.waitFor({ state: "visible", timeout: timeoutMs }),
      transcriptRow.waitFor({ state: "visible", timeout: timeoutMs }),
      failed.waitFor({ state: "visible", timeout: timeoutMs }).then(async () => {
        const message = await this.root
          .getByText(/Something went wrong|Please try again|Upload failed/i)
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
    await this.ensureRecordLiveMode();
    await this.startSpeakingButton.click();
  }

  async stopSpeaking() {
    await this.stopSpeakingButton.click();
  }

  async waitForRecordingState(timeoutMs = 15_000) {
    await expect(
      this.root.getByRole("button", { name: /Stop recording|^Stop$/i }),
    ).toBeVisible({ timeout: timeoutMs });
  }

  async waitForProcessingState(timeoutMs = 120_000) {
    await expect(
      this.root.getByText(/PROCESSING|Processing transcript|Generating/i).first(),
    ).toBeVisible({ timeout: timeoutMs });
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

  async tryWaitForTranscriptReady(timeoutMs = 30_000) {
    try {
      await this.waitForTranscriptReady(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  async tryStopSpeaking() {
    if (await this.stopSpeakingButton.isVisible().catch(() => false)) {
      await this.stopSpeakingButton.click();
      return true;
    }
    return false;
  }

  async waitForTranscriptContains(expectedLines, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.root.waitForFunction(transcriptHasPhrases, expectedLines, {
      timeout: timeoutMs,
    });
  }

  async waitForTranscriptSummary({
    keyPhrases,
    speakerCount,
    timeoutMs = TIMEOUTS.BACKEND_RESULT,
  }) {
    await this.root.waitForFunction(
      (params) => {
        const normalize = (value) =>
          String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const rows = Array.from(
          document.querySelectorAll(".flex.items-center.space-x-2"),
        );
        const rowText = normalize(rows.map((row) => row.textContent || "").join(" "));
        const rootText = normalize(document.body?.innerText || "");
        const text = `${rowText} ${rootText}`.trim();
        const speakers = new Set();
        const speakerMatches = text.match(/speaker\s*\d/gi) || [];
        speakerMatches.forEach((item) => speakers.add(item.toLowerCase()));
        const phrasesOk = (params.keyPhrases || []).every((line) =>
          text.includes(normalize(line)),
        );
        const speakersOk = params.speakerCount
          ? speakers.size >= Math.min(params.speakerCount, 2)
          : speakers.size > 0;
        return phrasesOk && speakersOk;
      },
      { keyPhrases, speakerCount },
      { timeout: timeoutMs },
    );
  }
}

module.exports = { SttPage };
