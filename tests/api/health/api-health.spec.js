const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { WidgetApiClient } = require("../helpers/widget-api-client");
const { getEnvironment } = require("../../config/environment");

test.describe("[Health] Widget API", () => {
  let api;

  test.beforeAll(async () => {
    const audioPath = path.join(__dirname, "../../data/stt/live-recording.opus");
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Health STT fixture missing: ${audioPath}`);
    }
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("token endpoint is reachable", async () => {
    const result = await api.healthCheckToken();
    expect(result.ok, result.detail).toBe(true);
    expect(result.browserId).toBeTruthy();
  });

  test("translate endpoint is reachable", async () => {
    await api.healthCheckToken();
    const result = await api.healthCheckTranslate("नमस्ते");
    expect(result.ok, result.detail).toBe(true);
  });

  test("stt endpoint is reachable", async () => {
    test.setTimeout(180_000);
    await api.healthCheckToken();
    const audioPath = path.join(__dirname, "../../data/stt/live-recording.opus");
    const result = await api.healthCheckStt(audioPath, { language: "en" });
    expect(result.ok, result.detail).toBe(true);
    expect(result.textLength).toBeGreaterThan(50);
  });

  test("tts endpoint is reachable", async () => {
    await api.healthCheckToken();
    const result = await api.healthCheckTts("API health check.");
    expect(result.ok, result.detail).toBe(true);
    expect(result.byteLength).toBeGreaterThan(500);
  });

  test("sample transcript asset is reachable", async () => {
    const result = await api.healthCheckSampleTranscript("speech-to-text-en.json");
    expect(result.ok, result.detail).toBe(true);
  });

  test("reports environment under test", async () => {
    const env = getEnvironment();
    expect(env.apiBaseUrl).toMatch(/^https:\/\//);
  });
});
