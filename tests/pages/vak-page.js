const { expect } = require("@playwright/test");
const { TIMEOUTS } = require("../utils/timeouts");

class VakPage {
  constructor(widgetPage) {
    this.widgetPage = widgetPage;
  }

  get root() {
    return this.widgetPage.getWidgetRoot();
  }

  get textInput() {
    return this.root.locator(
      "textarea[placeholder*='Type text in source language']",
    );
  }

  get sourceLanguagePicker() {
    return this.root.getByRole("button", { name: /\(Hindi\)|\(Bengali\)|\(Tamil\)/i }).last();
  }

  get destinationLanguagePicker() {
    return this.root.getByRole("button", { name: "Indian English", exact: true });
  }

  get speakerPicker() {
    return this.root.getByRole("button", { name: /Nisha|Speaker/i });
  }

  get emotionPicker() {
    return this.root.getByRole("button", { name: /Neutral/i });
  }

  async enterSourceText(text) {
    await this.textInput.fill(text);
  }

  async submitTranslation() {
    await this.textInput.press("Enter");
  }

  async translateText(text) {
    await this.enterSourceText(text);
    await this.submitTranslation();
  }

  async waitForDestinationText(pattern, timeoutMs = TIMEOUTS.BACKEND_RESULT) {
    await expect(this.root.getByText(pattern)).toBeVisible({ timeout: timeoutMs });
  }

  async openSourceLanguageMenu() {
    await this.sourceLanguagePicker.click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async selectSourceLanguage(languagePattern) {
    await this.openSourceLanguageMenu();
    await this.root
      .getByRole("button", { name: new RegExp(languagePattern, "i") })
      .first()
      .click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async openDestinationLanguageMenu() {
    await this.destinationLanguagePicker.click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async selectDestinationLanguage(languagePattern) {
    await this.openDestinationLanguageMenu();
    await this.root
      .getByRole("button", { name: new RegExp(languagePattern, "i") })
      .first()
      .click();
    await this.widgetPage.page.waitForTimeout(500);
  }

  async waitForSourceLanguageVisible(languagePattern, timeoutMs = 10_000) {
    await expect(
      this.root.getByText(new RegExp(languagePattern, "i")).first(),
    ).toBeVisible({ timeout: timeoutMs });
  }

  async assertControlsVisible() {
    await expect(this.textInput).toBeVisible();
    await expect(this.sourceLanguagePicker).toBeVisible();
    await expect(this.destinationLanguagePicker).toBeVisible();
    await expect(this.speakerPicker).toBeVisible();
    await expect(this.emotionPicker).toBeVisible();
  }
}

module.exports = { VakPage };
