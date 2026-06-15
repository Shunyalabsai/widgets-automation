const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("Zero STT Codeswitch module", () => {
  test("sample audio renders transcript", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Codeswitch");

    await sttPage.selectPrerecordedOption("Sample Audio");
    await sttPage.play();
    await sttPage.waitForPlaybackToStart();
    await sttPage.waitForTranscriptReady();

    await sttPage.assertCopyAvailable();
  });
});
