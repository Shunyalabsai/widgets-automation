const { test, expect } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("Zero STT Indic module", () => {
  test("uploaded audio renders transcript and allows playback", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Indic");
    await widgetPage.primeWidgetSession();

    const audioPath = path.join(__dirname, "..", "data", "stt", "live-recording.opus");

    for (let attempt = 0; attempt < 3; attempt++) {
      await sttPage.uploadButton.waitFor({ state: "visible", timeout: 10_000 });
      await sttPage.uploadAudioFile(audioPath);
      await sttPage.waitForUploadProcessing();

      try {
        await sttPage.waitForUploadResult();
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await widgetPage.goto();
        await widgetPage.openModule("Zero STT Indic");
        await widgetPage.primeWidgetSession();
      }
    }

    await expect(sttPage.root.getByText(/thank you for calling customer support/i)).toBeVisible({
      timeout: 30_000,
    });

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
