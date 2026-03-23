const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");

test.describe("Zero STT Med module", () => {
  test("upload file renders transcript", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const medPage = new MedicalTranscriptionPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Med");

    const audioPath = path.join(__dirname, "..", "data", "stt", "09  At The Doctor's.mp3");
    await medPage.uploadAudioFile(audioPath);
    await medPage.waitForProcessingState(120_000);
    await medPage.waitForTranscriptRows(180_000);
  });
});
