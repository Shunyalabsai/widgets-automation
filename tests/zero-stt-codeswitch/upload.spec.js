const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("Zero STT Codeswitch module", () => {
  test("uploaded audio renders codeswitched transcript", async ({ page }) => {
    test.setTimeout(300_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Codeswitch");

    const audioPath = path.join(__dirname, "..", "data", "codeswitch", "saira-hignlish.opus");

    for (let attempt = 0; attempt < 3; attempt++) {
      await sttPage.uploadButton.waitFor({ state: "visible", timeout: 10_000 });
      await sttPage.uploadAudioFile(audioPath);
      await sttPage.waitForUploadProcessing(180_000);

      try {
        await sttPage.waitForUploadResult(120_000);
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await widgetPage.goto();
        await widgetPage.openModule("Zero STT Codeswitch");
      }
    }

    await sttPage.assertCopyAvailable();
  });
});
