const ENVIRONMENTS = {
  stage: {
    name: "stage",
    siteUrl: "https://stage.shunyalabs.ai/",
    widgetPageBase: "https://stage.shunyalabs.ai/widget",
    playgroundUrl: "https://stage.shunyalabs.ai/playground",
    docsUrl: "https://stage.shunyalabs.ai/docs",
    consoleUrl: "https://stage.shunyalabs.ai/playground",
    widgetHost: "stage.shunyalabs.ai",
    apiBaseUrl: "https://stage.shunyalabs.ai/widget",
    siteOrigin: "https://stage.shunyalabs.ai",
  },
  prod: {
    name: "prod",
    siteUrl: "https://www.shunyalabs.ai/",
    widgetPageBase: "https://www.shunyalabs.ai/widget",
    playgroundUrl: "https://www.shunyalabs.ai/playground",
    docsUrl: "https://www.shunyalabs.ai/docs",
    consoleUrl: "https://www.shunyalabs.ai/playground",
    widgetHost: "www.shunyalabs.ai",
    // Playground widgets + static assets live under /widget on www (Nov 2025+ site).
    apiBaseUrl: "https://www.shunyalabs.ai/widget",
    siteOrigin: "https://www.shunyalabs.ai",
  },
};

function resolveEnvironmentName() {
  const explicit = (process.env.TEST_ENV || process.env.SHUNYA_ENV || "prod").toLowerCase();
  if (ENVIRONMENTS[explicit]) return explicit;
  if ((process.env.WIDGET_URL || "").includes("stage.")) return "stage";
  return "prod";
}

function getEnvironment() {
  const name = resolveEnvironmentName();
  const defaults = ENVIRONMENTS[name];
  return {
    ...defaults,
    siteUrl: process.env.WIDGET_URL || defaults.siteUrl,
    widgetPageBase: process.env.WIDGET_PAGE_BASE || defaults.widgetPageBase,
    playgroundUrl: process.env.PLAYGROUND_URL || defaults.playgroundUrl,
    docsUrl: process.env.DOCS_URL || defaults.docsUrl,
    consoleUrl: process.env.CONSOLE_URL || defaults.consoleUrl,
    apiBaseUrl: process.env.API_BASE_URL || defaults.apiBaseUrl,
    widgetHost: process.env.WIDGET_HOST || defaults.widgetHost,
  };
}

function isWidgetHost(url) {
  const env = getEnvironment();
  return (
    url.includes(env.widgetHost) ||
    url.includes("widget.shunyalabs.ai") ||
    url.includes("/widget?")
  );
}

module.exports = { ENVIRONMENTS, getEnvironment, isWidgetHost };
