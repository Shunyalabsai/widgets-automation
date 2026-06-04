const DEFAULT_WIDGET_URL = "https://www.shunyalabs.ai/";
const WIDGET_HOST = "stage-widget.shunyalabs.ai";

const MODULE_WIDGET_SLUGS = {
  "zero tts indic": "zero-tts-indic",
  "zero stt codeswitch": "zero-stt-codeswitch",
  "zero stt indic": "zero-stt-indic",
  "zero stt med": "zero-stt-med",
};

function moduleSlug(moduleName) {
  const slug = MODULE_WIDGET_SLUGS[moduleName.trim().toLowerCase()];
  if (!slug) {
    throw new Error(`Unknown widget module: ${moduleName}`);
  }
  return slug;
}

class WidgetPage {
  constructor(page) {
    this.page = page;
    this.widgetFrame = null;
    this.activeModule = null;
  }

  async goto() {
    const widgetUrl = process.env.WIDGET_URL || DEFAULT_WIDGET_URL;
    await this.page.goto(widgetUrl, { waitUntil: "domcontentloaded" });
    await this.page
      .getByRole("button", { name: /Zero TTS Indic|Zero STT Indic/i })
      .first()
      .waitFor({ timeout: 30_000 });
  }

  async openModule(moduleName) {
    const slug = moduleSlug(moduleName);

    await this.page
      .getByRole("button", { name: new RegExp(moduleName, "i") })
      .click();

    await this.page.waitForFunction(
      (expectedSlug) =>
        Array.from(document.querySelectorAll("iframe")).some((iframe) =>
          iframe.src.includes(`widget=${expectedSlug}`),
        ),
      slug,
      { timeout: 30_000 },
    );

    let frame = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      frame = this.page
        .frames()
        .find((candidate) => candidate.url().includes(`widget=${slug}`));
      if (frame) break;
      await this.page.waitForTimeout(500);
    }

    if (!frame) {
      throw new Error(`Widget iframe not found for module: ${moduleName}`);
    }

    this.widgetFrame = frame;

    await this.widgetFrame.waitForLoadState("domcontentloaded", {
      timeout: 30_000,
    });
    this.activeModule = moduleName;
    return this.widgetFrame;
  }

  getWidgetRoot() {
    return this.widgetFrame || this.page;
  }
}

module.exports = { WidgetPage, WIDGET_HOST, moduleSlug };
