const ENVIRONMENTS = {
  stage: {
    name: "stage",
    siteUrl: "https://stage.shunyalabs.ai/",
    widgetHost: "stage-widget.shunyalabs.ai",
    apiBaseUrl: "https://stage-widget.shunyalabs.ai",
    siteOrigin: "https://stage.shunyalabs.ai",
  },
  prod: {
    name: "prod",
    siteUrl: "https://www.shunyalabs.ai/",
    widgetHost: "widget.shunyalabs.ai",
    apiBaseUrl: "https://widget.shunyalabs.ai",
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
    apiBaseUrl: process.env.API_BASE_URL || defaults.apiBaseUrl,
    widgetHost: process.env.WIDGET_HOST || defaults.widgetHost,
  };
}

function isWidgetHost(url) {
  const env = getEnvironment();
  return url.includes(env.widgetHost) || url.includes("widget.shunyalabs.ai");
}

module.exports = { ENVIRONMENTS, getEnvironment, isWidgetHost };
