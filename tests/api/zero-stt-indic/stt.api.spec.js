const { test, expect } = require("@playwright/test");
const { WidgetApiClient } = require("../helpers/widget-api-client");
const { TIMEOUTS } = require("../../utils/timeouts");

test.describe("[API] Zero STT Indic", () => {
  let api;

  test.beforeAll(async () => {
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("token endpoint issues browser session", async () => {
    const token = await api.issueToken();
    expect(token.browser_id).toBeTruthy();
    expect(token.expires_at).toBeTruthy();
  });

  test("stt endpoint transcribes uploaded english audio", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const result = await api.transcribeAudio(
      require("path").join(__dirname, "../../data/stt/live-recording.opus"),
      { language: "en" },
    );
    expect(result.success).toBe(true);
    expect(result.text?.toLowerCase()).toContain("customer support");
  });

  test("sample transcript asset is available", async () => {
    const sample = await api.fetchSampleTranscript("speech-to-text-en.json");
    expect(sample.transcript?.text || sample.text).toBeTruthy();
  });
});
