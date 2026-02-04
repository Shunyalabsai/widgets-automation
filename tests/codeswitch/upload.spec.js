const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { CodeswitchPage } = require("../pages/codeswitch-page");

test.describe("CodeSwitch module", () => {
  test("upload file renders codeswitched transcript", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const codeswitchPage = new CodeswitchPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Codeswitch");

    const audioPath = path.join(
      __dirname,
      "..",
      "data",
      "codeswitch",
      "saira-hinglish-mix.opus",
    );
    await codeswitchPage.uploadAudioFile(audioPath);
    await codeswitchPage.waitForProcessingState(120_000);

    await codeswitchPage.waitForSpeakerLabel("Speaker 1", 180_000);
    await codeswitchPage.waitForTranscriptSnippet(
      "मैं सीरिसली बॉत फ्रेस्टेटेड हो चुकी हूँ इस साविस बिल्कुल बक्वास से और कुछ भी प्र",
      180_000,
    );

    await codeswitchPage.assertCopyAvailable();
  });
});
