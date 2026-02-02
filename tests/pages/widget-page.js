const DEFAULT_WIDGET_URL = "https://www.shunyalabs.ai/";

class WidgetPage {
  constructor(page) {
    this.page = page;
    this.moduleButtons = page.getByRole("button");
  }

  async goto() {
    const widgetUrl = process.env.WIDGET_URL || DEFAULT_WIDGET_URL;
    await this.page.goto(widgetUrl);
  }

  async openModule(moduleName) {
    await this.page
      .getByRole("button", { name: new RegExp(moduleName, "i") })
      .click();
  }
}

module.exports = { WidgetPage };
