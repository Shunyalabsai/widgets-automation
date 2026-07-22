const DEFAULT_WIDGET_URL = "https://www.shunyalabs.ai/";
const WIDGET_HOST = "widget.shunyalabs.ai";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MODULES = {
  "zero tts indic": {
    label: "Zero TTS Indic",
    slug: "zero-tts-indic",
    pageUrl: DEFAULT_WIDGET_URL,
    navigation: "tab",
  },
  "zero stt indic": {
    label: "Zero STT Indic",
    slug: "zero-stt-indic",
    pageUrl: DEFAULT_WIDGET_URL,
    navigation: "tab",
  },
  "zero stt codeswitch": {
    label: "Zero STT Codeswitch",
    slug: "zero-stt-codeswitch",
    pageUrl: DEFAULT_WIDGET_URL,
    navigation: "tab",
  },
  "zero stt med": {
    label: "Zero STT Med",
    slug: "zero-stt-med",
    pageUrl: DEFAULT_WIDGET_URL,
    navigation: "tab",
  },
  "zero stt jp/kr": {
    label: "Zero STT JP/KR",
    slug: "zero-stt-jpkr",
    pageUrl: DEFAULT_WIDGET_URL,
    navigation: "tab",
  },
  vak: {
    label: "VAK",
    slug: "vak",
    pageUrl: DEFAULT_WIDGET_URL,
    navigation: "tab",
  },
};

function moduleConfig(moduleName) {
  const config = MODULES[moduleName.trim().toLowerCase()];
  if (!config) {
    throw new Error(`Unknown widget module: ${moduleName}`);
  }
  return config;
}

function moduleSlug(moduleName) {
  return moduleConfig(moduleName).slug;
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
      .getByRole("tab", { name: /Zero TTS Indic|Zero STT Indic/i })
      .first()
      .waitFor({ timeout: 60_000 });
  }

  async openModule(moduleName) {
    const config = moduleConfig(moduleName);

    if (config.navigation === "product") {
      await this.page.goto(config.pageUrl, { waitUntil: "domcontentloaded" });
    } else {
      const currentUrl = this.page.url();
      if (!currentUrl.includes("shunyalabs.ai") || config.navigation === "tab") {
        const baseUrl = process.env.WIDGET_URL || DEFAULT_WIDGET_URL;
        if (!currentUrl.startsWith(baseUrl.replace(/\/$/, ""))) {
          await this.page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        }
        await this.page
          .getByRole("tab", {
            name: new RegExp(`^${escapeRegExp(config.label)}$`, "i"),
          })
          .click();
      }
    }

    await this.page.waitForFunction(
      (slug) =>
        Array.from(document.querySelectorAll("iframe")).some(
          (iframe) =>
            iframe.src.includes("widget.shunyalabs.ai") && iframe.src.includes(slug),
        ),
      config.slug,
      { timeout: 60_000 },
    );

    let frame = null;
    for (let attempt = 0; attempt < 80; attempt++) {
      frame = this.page
        .frames()
        .find(
          (candidate) =>
            candidate.url().includes(WIDGET_HOST) &&
            candidate.url().includes(config.slug),
        );
      if (frame) break;
      await this.page.waitForTimeout(500);
    }

    if (!frame) {
      throw new Error(`Widget iframe not found for module: ${moduleName}`);
    }

    this.widgetFrame = frame;
    await this.widgetFrame.waitForLoadState("domcontentloaded", {
      timeout: 60_000,
    });
    await this.page.waitForTimeout(1500);
    this.activeModule = moduleName;
    return this.widgetFrame;
  }

  getWidgetRoot() {
    return this.widgetFrame || this.page;
  }

  async primeWidgetSession() {
    await this.page.context().grantPermissions(["microphone"], {
      origin: "https://www.shunyalabs.ai",
    });
    await this.page.context().grantPermissions(["microphone"], {
      origin: `https://${WIDGET_HOST}`,
    });

    const root = this.getWidgetRoot();
    await root.getByRole("tab", { name: /Record live/i }).click();
    await this.page.waitForTimeout(500);

    const startButton = root.getByRole("button", { name: /Start recording|Start Speaking/i });
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await this.page.waitForTimeout(1500);
    }

    const stopButton = root.getByRole("button", {
      name: /Stop recording|^Stop$/i,
    });
    if (await stopButton.isVisible().catch(() => false)) {
      await stopButton.click();
    }

    await root.getByRole("tab", { name: /Upload file/i }).click().catch(() => {});

    await this.page.waitForTimeout(2000);
  }
}

module.exports = { WidgetPage, WIDGET_HOST, moduleSlug, MODULES };
