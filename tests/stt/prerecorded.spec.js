const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("STT module", () => {
  test("prerecorded customer support call renders transcript", async ({ page }) => {
    test.setTimeout(90_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Speech To Text");

    await sttPage.selectPrerecordedOption("Customer Support Call");

    await sttPage.play();
    await sttPage.waitForPlaybackToStart();
    await sttPage.waitForTranscriptReady();

    await sttPage.clickSpeakerLabels();
    await sttPage.clickFirstTranscriptRow();

    await sttPage.pauseButton.click();
    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
