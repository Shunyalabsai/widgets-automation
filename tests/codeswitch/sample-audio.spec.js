const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { CodeswitchPage } = require("../pages/codeswitch-page");

test.describe("CodeSwitch module", () => {
  test("sample audio renders transcript", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const codeswitchPage = new CodeswitchPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Codeswitch");

    await codeswitchPage.selectSampleAudio();
    await codeswitchPage.playSampleAudio();

    await codeswitchPage.waitForTranscriptRows(180_000);
    await codeswitchPage.waitForSpeakerLabel("Speaker 1", 180_000);
    await codeswitchPage.assertCopyAvailable();
  });
});
