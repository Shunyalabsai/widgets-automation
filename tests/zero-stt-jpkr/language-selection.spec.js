// Disabled: new website ASR no longer supports Japanese/Korean (Jul 2026).
const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { JpKrSttPage } = require("../pages/jpkr-stt-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe.skip("[UI] Zero STT JP/KR module", () => {
  test("language picker switches between Japanese and Korean", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const widgetPage = new WidgetPage(page);
    const sttPage = new JpKrSttPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT JP/KR");

    await sttPage.assertLanguageVisible("Japanese");
    await sttPage.selectLanguage("Korean");
    await sttPage.assertLanguageVisible("Korean");

    await sttPage.selectLanguage("Japanese");
    await sttPage.assertLanguageVisible("Japanese");
  });
});
