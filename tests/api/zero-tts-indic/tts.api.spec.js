const { test, expect } = require("@playwright/test");
const { WidgetApiClient } = require("../helpers/widget-api-client");
const { TIMEOUTS } = require("../../utils/timeouts");

test.describe("[API] Zero TTS Indic", () => {
  let api;

  test.beforeAll(async () => {
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("tts endpoint returns audio for hindi voice", async () => {
    test.setTimeout(TIMEOUTS.TTS_PROCESSING);
    const result = await api.synthesizeSpeech("Namaste, yeh ek API test hai.", {
      speaker: "Rajesh",
      language: "hi",
    });
    expect(result.byteLength).toBeGreaterThan(1000);
    expect(result.contentType).toMatch(/audio\//);
  });

  test("tts endpoint supports english voice selection", async () => {
    test.setTimeout(TIMEOUTS.TTS_PROCESSING);
    const result = await api.synthesizeSpeech("This is an English API test.", {
      speaker: "Varun",
      language: "en",
    });
    expect(result.byteLength).toBeGreaterThan(1000);
  });
});
