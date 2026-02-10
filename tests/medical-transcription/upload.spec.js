const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");

test.describe("Medical Transcription module", () => {
  test("upload file renders transcript", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const medicalPage = new MedicalTranscriptionPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Medical Transcription");

    const audioPath = path.join(
      __dirname,
      "..",
      "data",
      "stt",
      "09  At The Doctor's.mp3",
    );
    await medicalPage.uploadAudioFile(audioPath);
    await medicalPage.waitForProcessingState(120_000);
    await medicalPage.waitForTranscriptRows(180_000);
  });
});
