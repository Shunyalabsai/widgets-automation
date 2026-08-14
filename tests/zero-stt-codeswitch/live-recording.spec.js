const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage, WIDGET_HOST } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");
const { TIMEOUTS } = require("../utils/timeouts");
const { getLiveRecordingWaitSeconds } = require("../utils/audio-utils");
const { finishLiveRecordingWithUpload } = require("../utils/upload-helpers");

test.describe("[UI] Zero STT Codeswitch module", () => {
  test("simulated live recording validates transcript and speakers", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);
    const moduleName = "Zero STT Codeswitch";

    await page.context().grantPermissions(["microphone"], {
      origin: "https://www.shunyalabs.ai",
    });
    await page.context().grantPermissions(["microphone"], {
      origin: `https://${WIDGET_HOST}`,
    });

    await widgetPage.goto();
    await widgetPage.openModule(moduleName);

    await sttPage.startSpeaking();
    await sttPage.tryWaitForRecordingState(10_000);

    const audioPath = path.join(__dirname, "..", "data", "codeswitch", "live-recording.opus");
    const durationSeconds = getLiveRecordingWaitSeconds(audioPath);
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000) + 1500);

    const stopped = await sttPage.tryStopSpeaking();
    if (stopped) {
      await sttPage.tryWaitForProcessingState(30_000);
    }

    await finishLiveRecordingWithUpload({
      widgetPage,
      moduleName,
      pageObject: sttPage,
      audioPath,
    });

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
