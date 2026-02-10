const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("STT module", () => {
  test("prerecorded podcast renders transcript lines in order", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Speech To Text");

    await sttPage.selectPrerecordedOption("Podcast");
    await sttPage.play();
    await sttPage.waitForPlaybackToStart();
    await sttPage.waitForTranscriptReady(150_000);

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
