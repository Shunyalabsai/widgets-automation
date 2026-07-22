const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { VakPage } = require("../pages/vak-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("VAK module", () => {
  test("hindi text translates to indian english", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const widgetPage = new WidgetPage(page);
    const vakPage = new VakPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("VAK");
    await vakPage.assertControlsVisible();

    await vakPage.translateText("नमस्ते, आप कैसे हैं?");
    await vakPage.waitForDestinationText(/hello.*how are you/i);
  });

  test("bengali source text translates to indian english", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const widgetPage = new WidgetPage(page);
    const vakPage = new VakPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("VAK");

    await vakPage.selectSourceLanguage("Bengali");
    await vakPage.waitForSourceLanguageVisible("Bengali");
    await vakPage.translateText("আমি ভালো আছি");
    await vakPage.waitForDestinationText(/i am fine|i'm fine|i am good/i);
  });
});
