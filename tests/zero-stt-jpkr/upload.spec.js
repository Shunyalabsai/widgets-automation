// Disabled: new website ASR no longer supports Japanese/Korean (Jul 2026).
const { test, expect } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { JpKrSttPage } = require("../pages/jpkr-stt-page");
const { TIMEOUTS } = require("../utils/timeouts");
const { uploadWithRetry } = require("../utils/upload-helpers");

test.describe.skip("Zero STT JP/KR module", () => {
  test("uploaded audio renders transcript and allows copy", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const sttPage = new JpKrSttPage(widgetPage);
    const moduleName = "Zero STT JP/KR";

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
    ).toBeVisible({ timeout: 30_000 });

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
