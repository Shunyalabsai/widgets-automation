const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("Zero STT Med module", () => {
  test("upload file renders transcript", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const medPage = new MedicalTranscriptionPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Med");
    await widgetPage.primeWidgetSession();

    const audioPath = path.join(__dirname, "..", "data", "stt", "09  At The Doctor's.mp3");
    await medPage.uploadAudioFile(audioPath);
    await medPage.waitForUploadProcessing();
    await medPage.waitForUploadResult();
    await medPage.waitForTranscriptRows();
  });
});
