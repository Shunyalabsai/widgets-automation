const { test, expect } = require("@playwright/test");
const { WidgetApiClient } = require("../helpers/widget-api-client");
const { getEnvironment } = require("../../config/environment");

test.describe("[Health] Live www widget assets", () => {
  let api;

  test.beforeAll(async () => {
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("sample transcript asset is reachable", async () => {
    const result = await api.healthCheckSampleTranscript("speech-to-text-en.json");
    expect(result.ok, result.detail).toBe(true);
  });

  test("reports environment under test", async () => {
    const env = getEnvironment();
    expect(env.apiBaseUrl).toMatch(/^https:\/\//);
    expect(env.apiBaseUrl).toMatch(/\/widget$/);
  });
});
