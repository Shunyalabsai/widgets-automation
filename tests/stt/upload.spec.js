const { test, expect } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("STT module", () => {
  test("uploaded audio renders transcript and allows playback", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Speech To Text");

    const audioPath = path.join(
      __dirname,
      "..",
      "data",
      "stt",
      "saira-mix.opus",
    );
    await sttPage.uploadAudioFile(audioPath);
    await sttPage.waitForUploadProcessing(180_000);

    await sttPage.waitForAnySpeakerLabel(180_000);
    await expect(page.getByText(/today.*calling/i)).toBeVisible({ timeout: 30_000 });

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
