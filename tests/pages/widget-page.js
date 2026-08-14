const { getEnvironment, isWidgetHost } = require("../config/environment");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function envConfig() {
  return getEnvironment();
}

const MODULES = {
  "zero tts indic": {
    label: "Zero TTS Indic",
    slug: "zero-tts-indic",
    navigation: "embed",
  },
  "zero stt indic": {
    label: "Zero STT Indic",
    slug: "zero-stt-indic",
    navigation: "embed",
  },
  "zero stt codeswitch": {
    label: "Zero STT Codeswitch",
    slug: "zero-stt-codeswitch",
    navigation: "embed",
  },
  "zero stt med": {
    label: "Zero STT Med",
    slug: "zero-stt-med",
    navigation: "embed",
  },
  vak: {
    label: "VAK",
    slug: "vak",
    navigation: "embed",
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
    this.env = envConfig();
  }

  async goto() {
    await this.page.goto(this.env.siteUrl, { waitUntil: "domcontentloaded" });
    await this.page
      .getByRole("heading", { name: /Voice AI Stack/i })
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.page
      .getByRole("tab", { name: /Zero TTS Indic|Zero STT Indic/i })
      .first()
      .waitFor({ timeout: 60_000 });
  }

  embedUrl(config) {
    const suffix = config.slug === "vak" ? "&inlinePickers=1" : "";
    return `https://${this.env.widgetHost}/?widget=${config.slug}-v2&embed=1${suffix}`;
  }

  async waitForModuleReady(config, root = this.page) {
    if (config.slug === "zero-tts-indic") {
      await root.locator("textarea").first().waitFor({
        state: "visible",
        timeout: 60_000,
      });
      return;
    }

    if (config.slug === "vak") {
      await root
        .locator("textarea[placeholder*='Type text in source language']")
        .waitFor({ state: "visible", timeout: 60_000 });
      return;
    }

    await root.getByRole("tab", { name: /Sample clips/i }).waitFor({
      state: "visible",
      timeout: 60_000,
    });
  }

  async openModule(moduleName) {
    const config = moduleConfig(moduleName);
    const embedUrl = this.embedUrl(config);

    await this.page.goto(embedUrl, { waitUntil: "domcontentloaded" });
    await this.waitForModuleReady(config, this.page);

    this.widgetFrame = this.page.mainFrame();
    await this.widgetFrame
      .waitForLoadState("domcontentloaded", { timeout: 60_000 })
      .catch(() => {});
    await this.page.waitForTimeout(500);
    this.activeModule = moduleName;
    return this.widgetFrame;
  }

  getWidgetRoot() {
    return this.widgetFrame || this.page;
  }

  async primeWidgetSession() {
    await this.page.context().grantPermissions(["microphone"], {
      origin: this.env.siteOrigin,
    });
    await this.page.context().grantPermissions(["microphone"], {
      origin: `https://${this.env.widgetHost}`,
    });

    const root = this.getWidgetRoot();
    const recordTab = root.getByRole("tab", { name: /Record live/i });
    if (await recordTab.isVisible().catch(() => false)) {
      await recordTab.click();
      await this.page.waitForTimeout(500);
    }

    const startButton = root.getByRole("button", {
      name: /Start recording|Start Speaking/i,
    });
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

    const uploadTab = root.getByRole("tab", { name: /Upload file/i });
    if (await uploadTab.isVisible().catch(() => false)) {
      await uploadTab.click().catch(() => {});
    }

    await this.page.waitForTimeout(2000);
  }
}

module.exports = {
  WidgetPage,
  WIDGET_HOST: getEnvironment().widgetHost,
  moduleSlug,
  MODULES,
  getEnvironment,
  isWidgetHost,
};
