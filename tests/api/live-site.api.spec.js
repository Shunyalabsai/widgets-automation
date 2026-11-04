const { test, expect } = require("@playwright/test");
const { WidgetApiClient } = require("./helpers/widget-api-client");
const { getEnvironment } = require("../config/environment");
const { STATIC_TRANSCRIPTS, STATIC_AUDIO } = require("../config/live-products");

/** Public widget assets and config exposed on the live www site (no legacy embed APIs). */
test.describe("[API] Live www widget static assets", () => {
  let api;

  test.beforeAll(async () => {
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test("api base matches live widget host", async () => {
    const env = getEnvironment();
    expect(env.apiBaseUrl).toMatch(/shunyalabs\.ai\/widget$/);
    expect(env.widgetPageBase).toBe(env.apiBaseUrl);
  });

  for (const file of STATIC_TRANSCRIPTS) {
    test(`transcript ${file} is valid JSON`, async () => {
      const sample = await api.fetchSampleTranscript(file);
      const text = sample.transcript?.text || sample.text || "";
      expect(text.length).toBeGreaterThan(20);
    });
  }

  for (const file of STATIC_AUDIO) {
    test(`audio ${file} is reachable`, async () => {
      const body = await api.fetchSampleAudio(file);
      expect(body.byteLength || body.length).toBeGreaterThan(1000);
    });
  }
});
