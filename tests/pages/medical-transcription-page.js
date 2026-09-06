const { expect } = require("@playwright/test");
const { TIMEOUTS } = require("../utils/timeouts");
const {
  transcriptHasMeaningfulContent,
  transcriptHasPhrases,
} = require("../utils/transcript-text");

class MedicalTranscriptionPage {
  constructor(widgetPage) {
    this.widgetPage = widgetPage;
  }

  get root() {
    return this.widgetPage.getWidgetRoot();
  }

  get patientNotesButton() {
    return this.root.getByRole("button", { name: /Patient Notes/i });
  }

  get doctorAppointmentButton() {
    return this.root.getByRole("button", {
      name: /Doctor's Appointment/i,
    });
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

  get playButton() {
    return this.root.getByRole("button", { name: /^Play$/i });
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

  async ensureSampleClipsMode() {
    await this.sampleClipsTab.click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async ensureUploadMode() {
    await this.uploadButton.click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async ensureRecordLiveMode() {
    await this.recordLiveTab.click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async selectPatientNotes() {
    await this.ensureSampleClipsMode();
    await this.patientNotesButton.click();
  }

  async selectDoctorAppointment() {
    await this.ensureSampleClipsMode();
    await this.doctorAppointmentButton.click();
  }

  async playAudio() {
    await this.playButton.click();
  }

  async copyConversation() {
    await this.copyButton.click();
  }

  async assertCopyAvailable() {
    await expect(this.copyButton).toBeEnabled({ timeout: 60_000 });
  }

  async startSpeaking() {
    await this.ensureRecordLiveMode();
    await this.startSpeakingButton.click();
  }

  async stopSpeaking() {
    await this.stopSpeakingButton.click();
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
    const loaderIcon = this.root.locator(".lucide.lucide-loader-circle");
    try {
      await loaderIcon.first().waitFor({ timeout: 15_000 });
      await loaderIcon.first().waitFor({ state: "hidden", timeout: timeoutMs });
    } catch {
      // Loader may have appeared and disappeared before we checked — continue
    }
  }

  async waitForProcessingState(timeoutMs = 120_000) {
    await expect(
      this.root.getByText(/PROCESSING|Processing transcript|Generating/i).first(),
    ).toBeVisible({ timeout: timeoutMs });
  }

  get pauseButton() {
    return this.root.getByRole("button", { name: /^Pause$/i });
  }

  async waitForPlaybackToStart() {
    await this.pauseButton.waitFor({ timeout: 60_000 });
  }

  async waitForTranscriptRows(timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.root.waitForFunction(transcriptHasMeaningfulContent, 120, {
      timeout: timeoutMs,
    });
  }

  async tryWaitForTranscriptRows(timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    try {
      await this.waitForTranscriptRows(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  async waitForTranscriptContains(expectedLines, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.root.waitForFunction(transcriptHasPhrases, expectedLines, {
      timeout: timeoutMs,
    });
  }

  async waitForSpeakerLabel(label, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.waitForTranscriptContains([label], timeoutMs);
  }

  async waitForTranscriptSnippet(snippet, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.waitForTranscriptContains([snippet], timeoutMs);
  }
}

module.exports = { MedicalTranscriptionPage };
