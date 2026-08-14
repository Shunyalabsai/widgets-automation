const { test, expect } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");
const { TIMEOUTS } = require("../utils/timeouts");
const { uploadWithRetry } = require("../utils/upload-helpers");

test.describe("[UI] Zero STT Indic module", () => {
  test("uploaded audio renders transcript and allows playback", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);
    const moduleName = "Zero STT Indic";

    await widgetPage.goto();
    await widgetPage.openModule(moduleName);

    const audioPath = path.join(__dirname, "..", "data", "stt", "live-recording.opus");
    await uploadWithRetry({
      widgetPage,
      moduleName,
      audioPath,
      pageObject: sttPage,
    });

    await expect(
      sttPage.root.getByText(/thank you for calling customer support/i).first(),
    ).toBeVisible({
      timeout: 30_000,
    });

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
