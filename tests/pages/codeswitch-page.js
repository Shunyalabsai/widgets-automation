const { expect } = require("@playwright/test");

class CodeswitchPage {
  constructor(page) {
    this.page = page;
    this.playButton = page.getByRole("button", { name: /Play audio/i });
    this.uploadButton = page.getByRole("button", { name: /Upload your file/i });
    this.copyButton = page.getByRole("button", { name: /Copy Conversation/i });
    this.startSpeakingButton = page.getByRole("button", { name: /Start Speaking/i });
    this.stopSpeakingButton = page.getByRole("button", { name: /Stop/i });
    this.loaderIcon = page.locator(".lucide.lucide-loader-circle");
  }

  async selectSampleAudio() {
    await this.page.getByRole("button", { name: /Sample Audio/i }).click();
  }

  async playSampleAudio() {
    await this.playButton.click();
  }

  async startSpeaking() {
    await this.startSpeakingButton.click();
  }

  async stopSpeaking() {
    await this.stopSpeakingButton.click();
  }

  async waitForRecordingState(timeoutMs = 15_000) {
    await expect(this.page.getByText("RECORDING", { exact: true })).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async tryWaitForRecordingState(timeoutMs = 10_000) {
    try {
      await this.waitForRecordingState(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  async waitForProcessingState(timeoutMs = 120_000) {
    await expect(this.page.getByText("PROCESSING", { exact: true })).toBeVisible({
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

  async waitForTranscriptSummary({
    keyPhrases,
    speakerCount,
    minSpeakerCount,
    minPhraseMatches,
    timeoutMs = 180_000,
  }) {
    await this.page.waitForFunction(
      (params) => {
        const rows = Array.from(
          document.querySelectorAll(".flex.items-center.space-x-2"),
        );
        const phrases = Array.isArray(params.keyPhrases)
          ? params.keyPhrases
          : [];
        const normalize = (value) =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9\s\u0900-\u097f]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        const text = normalize(rows.map((row) => row.textContent || "").join(" "));
        const speakers = new Set();
        rows.forEach((row) => {
          const match = (row.textContent || "").match(/Speaker\s*\d/gi);
          if (match) match.forEach((item) => speakers.add(item.toLowerCase()));
        });
        const phraseMatches = phrases.filter((line) =>
          text.includes(normalize(line)),
        ).length;
        const minMatches =
          typeof params.minPhraseMatches === "number"
            ? params.minPhraseMatches
            : phrases.length;
        const phrasesOk = phraseMatches >= minMatches;
        const speakersOk =
          typeof params.minSpeakerCount === "number"
            ? speakers.size >= params.minSpeakerCount
            : params.speakerCount
              ? speakers.size === params.speakerCount
              : speakers.size > 0;
        return phrasesOk && speakersOk;
      },
      { keyPhrases, speakerCount, minSpeakerCount, minPhraseMatches },
      { timeout: timeoutMs },
    );
  }

  async waitForSpeakerLabel(label, timeoutMs = 120_000) {
    await expect(this.page.getByText(label)).toBeVisible({ timeout: timeoutMs });
  }

  async waitForAnySpeakerLabel(timeoutMs = 120_000) {
    await expect(this.page.getByText(/Speaker\s*\d/i).first()).toBeVisible({
      timeout: timeoutMs,
    });
  }

  async assertCopyAvailable() {
    await expect(this.copyButton).toBeEnabled();
  }
}

module.exports = { CodeswitchPage };
