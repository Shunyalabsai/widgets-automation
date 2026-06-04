const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("Zero STT Indic module", () => {
  test("prerecorded customer support call renders transcript", async ({ page }) => {
    test.setTimeout(150_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Indic");

    await sttPage.selectPrerecordedOption("Customer Support Call");
    await sttPage.play();
    await sttPage.waitForPlaybackToStart();
    await sttPage.waitForTranscriptReady();

    await sttPage.clickFirstTranscriptRow();
    await sttPage.pauseButton.click();
    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });

  test("prerecorded podcast renders transcript", async ({ page }) => {
    test.setTimeout(150_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Indic");

    await sttPage.selectPrerecordedOption("Podcast");
    await sttPage.play();
    await sttPage.waitForPlaybackToStart();
    await sttPage.waitForTranscriptReady();

    await sttPage.clickFirstTranscriptRow();
    await sttPage.pauseButton.click();
    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
