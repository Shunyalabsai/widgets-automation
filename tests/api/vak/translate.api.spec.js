const { test, expect } = require("@playwright/test");
const { WidgetApiClient } = require("../helpers/widget-api-client");
const { TIMEOUTS } = require("../../utils/timeouts");

test.describe("[API] VAK", () => {
  let api;

  test.beforeAll(async () => {
    api = new WidgetApiClient();
    await api.init();
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test("translate endpoint returns hindi to english text", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const result = await api.translateText("नमस्ते, आप कैसे हैं?", {
      sourceLang: "hi",
      targetLang: "en",
    });
    expect(result.status).toBe("ok");
    expect(result.translated_text?.toLowerCase()).toMatch(/hello|hi/);
  });

  test("translate endpoint supports bengali source", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const result = await api.translateText("আমি ভালো আছি", {
      sourceLang: "bn",
      targetLang: "en",
    });
    expect(result.status).toBe("ok");
    expect(result.translated_text?.length).toBeGreaterThan(3);
  });

  test("tts endpoint returns audio for translated output", async () => {
    test.setTimeout(TIMEOUTS.TTS_PROCESSING);
    const translated = await api.translateText("नमस्ते", {
      sourceLang: "hi",
      targetLang: "en",
    });
    const audio = await api.synthesizeSpeech(translated.translated_text, {
      speaker: "Nisha",
      language: "en",
    });
    expect(audio.byteLength).toBeGreaterThan(1000);
  });
});
