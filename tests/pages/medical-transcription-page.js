const { expect } = require("@playwright/test");
const { TIMEOUTS } = require("../utils/timeouts");

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
    return this.root.getByRole("button", { name: /Upload your file/i });
  }

  get playButton() {
    return this.root.getByRole("button", { name: /Play audio/i });
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

  async selectPatientNotes() {
    await this.patientNotesButton.click();
  }

  async selectDoctorAppointment() {
    await this.doctorAppointmentButton.click();
  }

  async playAudio() {
    await this.playButton.click();
  }

  async copyConversation() {
    await this.copyButton.click();
  }

  async startSpeaking() {
    await this.startSpeakingButton.click();
  }

  async stopSpeaking() {
    await this.stopSpeakingButton.click();
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
    const transcriptRow = this.root.locator(".flex.items-center.space-x-2").first();

    await Promise.race([
      transcriptRow.waitFor({ state: "visible", timeout: timeoutMs }),
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
    const loaderIcon = this.root.locator(".lucide.lucide-loader-circle");
    try {
      await loaderIcon.first().waitFor({ timeout: 15_000 });
      await loaderIcon.first().waitFor({ state: "hidden", timeout: timeoutMs });
    } catch {
      // Loader may have appeared and disappeared before we checked — continue
    }
  }

  async waitForProcessingState(timeoutMs = 120_000) {
    await expect(this.root.getByText("PROCESSING", { exact: true })).toBeVisible({
      timeout: timeoutMs,
    });
  }

  get pauseButton() {
    return this.root.getByRole("button", { name: /Pause audio/i });
  }

  async waitForPlaybackToStart() {
    await this.pauseButton.waitFor();
  }

  async waitForTranscriptRows(timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await this.root.waitForFunction(
      () =>
        document.querySelectorAll(".flex.items-center.space-x-2").length > 0,
      null,
      { timeout: timeoutMs },
    );
  }

  async tryWaitForTranscriptRows(timeoutMs = 30_000) {
    try {
      await this.waitForTranscriptRows(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  async waitForSpeakerLabel(label, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await expect(this.root.getByText(label)).toBeVisible({ timeout: timeoutMs });
  }

  async waitForTranscriptSnippet(snippet, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await expect(this.root.getByText(snippet)).toBeVisible({ timeout: timeoutMs });
  }
}

module.exports = { MedicalTranscriptionPage };
