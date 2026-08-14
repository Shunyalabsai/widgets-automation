const { test, expect } = require("@playwright/test");
const path = require("path");
const { WidgetApiClient } = require("../helpers/widget-api-client");
const { TIMEOUTS } = require("../../utils/timeouts");

test.describe("[API] Zero STT Med", () => {
  let api;

  test.beforeAll(async () => {
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("stt endpoint accepts medical domain upload", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const result = await api.transcribeAudio(
      path.join(__dirname, "../../data/stt/live-recording.opus"),
      { language: "en", domain: "medical" },
    );
    expect(result.success).toBe(true);
    expect(result.text?.length).toBeGreaterThan(20);
  });

  test("patient notes sample transcript asset is available", async () => {
    const sample = await api.fetchSampleTranscript("patient_note.json");
    expect(sample.transcript?.text || sample.text).toBeTruthy();
  });
});
