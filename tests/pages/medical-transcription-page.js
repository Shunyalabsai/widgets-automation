const { expect } = require("@playwright/test");

class MedicalTranscriptionPage {
  constructor(page) {
    this.page = page;
    this.patientNotesButton = page.getByRole("button", { name: /Patient Notes/i });
    this.doctorAppointmentButton = page.getByRole("button", {
      name: /Doctor's Appointment/i,
    });
    this.uploadButton = page.getByRole("button", { name: /Upload your file/i });
    this.playButton = page.getByRole("button", { name: /Play audio/i });
    this.copyButton = page.getByRole("button", { name: /Copy Conversation/i });
    this.startSpeakingButton = page.getByRole("button", { name: /Start Speaking/i });
    this.stopSpeakingButton = page.getByRole("button", { name: /Stop/i });
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

  async waitForTranscriptRows(timeoutMs = 180_000) {
    await this.page.waitForFunction(
      () =>
        document.querySelectorAll(".flex.items-center.space-x-2").length > 0,
      null,
      { timeout: timeoutMs },
    );
  }

  async waitForSpeakerLabel(label, timeoutMs = 180_000) {
    await expect(this.page.getByText(label)).toBeVisible({ timeout: timeoutMs });
  }

  async waitForTranscriptSnippet(snippet, timeoutMs = 180_000) {
    await expect(this.page.getByText(snippet)).toBeVisible({ timeout: timeoutMs });
  }
}

module.exports = { MedicalTranscriptionPage };
