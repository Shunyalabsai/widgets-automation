const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage, WIDGET_HOST } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");
const { TIMEOUTS } = require("../utils/timeouts");
const { getLiveRecordingWaitSeconds } = require("../utils/audio-utils");

test.describe("Zero STT Med module", () => {
  test("live recording start/stop", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const medPage = new MedicalTranscriptionPage(widgetPage);

    await page.context().grantPermissions(["microphone"], {
      origin: "https://www.shunyalabs.ai",
    });
    await page.context().grantPermissions(["microphone"], {
      origin: `https://${WIDGET_HOST}`,
    });

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Med");

    await medPage.startSpeaking();

    const audioPath = path.join(__dirname, "..", "data", "stt", "live-recording.opus");
    const durationSeconds = getLiveRecordingWaitSeconds(audioPath);
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000) + 1500);
    await medPage.stopSpeaking();

    await medPage.uploadAudioFile(audioPath);
    await medPage.waitForUploadProcessing();
    await medPage.waitForUploadResult();
    await medPage.waitForTranscriptRows();
  });
});
