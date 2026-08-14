const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");
const { TIMEOUTS } = require("../utils/timeouts");
const { uploadWithRetry } = require("../utils/upload-helpers");

test.describe("[UI] Zero STT Codeswitch module", () => {
  test("uploaded audio renders codeswitched transcript", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_SLOW);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);
    const moduleName = "Zero STT Codeswitch";

    await widgetPage.goto();
    await widgetPage.openModule(moduleName);

    const audioPath = path.join(__dirname, "..", "data", "codeswitch", "saira-hignlish.opus");
    await uploadWithRetry({
      widgetPage,
      moduleName,
      audioPath,
      pageObject: sttPage,
    });

    await sttPage.waitForAnySpeakerLabel(60_000);
    await sttPage.assertCopyAvailable();
  });
});
