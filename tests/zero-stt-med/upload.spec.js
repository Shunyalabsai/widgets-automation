const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");
const { TIMEOUTS } = require("../utils/timeouts");
const { uploadWithRetry } = require("../utils/upload-helpers");

test.describe("Zero STT Med module", () => {
  test("upload file renders transcript", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const medPage = new MedicalTranscriptionPage(widgetPage);
    const moduleName = "Zero STT Med";

    await widgetPage.goto();
    await widgetPage.openModule(moduleName);

    const audioPath = path.join(__dirname, "..", "data", "stt", "09  At The Doctor's.mp3");
    await uploadWithRetry({
      widgetPage,
      moduleName,
      audioPath,
      pageObject: medPage,
    });
    await medPage.waitForTranscriptRows();
  });
});
