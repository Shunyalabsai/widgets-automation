const { test, expect } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { VakPage } = require("../pages/vak-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("[UI] VAK module", () => {
  test("source and destination language pickers are interactive", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const widgetPage = new WidgetPage(page);
    const vakPage = new VakPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("VAK");

    await vakPage.openSourceLanguageMenu();
    await expect(
      vakPage.root.getByRole("button", { name: /Tamil|Telugu|Marathi/i }).first(),
    ).toBeVisible();

    await vakPage.selectSourceLanguage("Tamil");
    await vakPage.waitForSourceLanguageVisible("Tamil");

    await vakPage.openDestinationLanguageMenu();
    await expect(
      vakPage.root.getByRole("button", { name: /Hindi|Bengali|Gujarati/i }).first(),
    ).toBeVisible();
  });

  test("speaker and emotion controls are visible", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_FAST);
    const widgetPage = new WidgetPage(page);
    const vakPage = new VakPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("VAK");

    await expect(vakPage.speakerPicker).toBeVisible();
    await expect(vakPage.emotionPicker).toBeVisible();
    await expect(vakPage.root.getByText(/Nisha/i).first()).toBeVisible();
    await expect(vakPage.root.getByText(/Neutral/i).first()).toBeVisible();
  });
});
