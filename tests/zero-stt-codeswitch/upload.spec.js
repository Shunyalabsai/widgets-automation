const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("Zero STT Codeswitch module", () => {
  test("uploaded audio renders codeswitched transcript", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Codeswitch");
    await widgetPage.primeWidgetSession();

    const audioPath = path.join(__dirname, "..", "data", "codeswitch", "saira-hignlish.opus");

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
        await widgetPage.openModule("Zero STT Codeswitch");
        await widgetPage.primeWidgetSession();
      }
    }

    await sttPage.waitForAnySpeakerLabel(60_000);
    await sttPage.assertCopyAvailable();
  });
});
