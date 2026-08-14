const { test, expect } = require("@playwright/test");
const path = require("path");
const { WidgetApiClient } = require("../helpers/widget-api-client");
const { TIMEOUTS } = require("../../utils/timeouts");

test.describe("[API] Zero STT Codeswitch", () => {
  let api;

  test.beforeAll(async () => {
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("stt endpoint transcribes hinglish upload", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const result = await api.transcribeAudio(
      path.join(__dirname, "../../data/codeswitch/saira-hignlish.opus"),
      { language: "hi-en" },
    );
    expect(result.success).toBe(true);
    expect(result.text?.length).toBeGreaterThan(20);
  });

  test("codeswitch sample transcript asset is available", async () => {
    const sample = await api.fetchSampleTranscript("Hinglish_sample_1.json");
    const transcript = sample.transcript || sample;
    expect(transcript.words?.length || transcript.text?.length).toBeTruthy();
  });
});
