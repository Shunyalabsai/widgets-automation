const path = require("path");
const { test, expect } = require("@playwright/test");
const { WidgetApiClient } = require("./helpers/widget-api-client");
const { TIMEOUTS } = require("../utils/timeouts");

/** Full regression: direct backend VAK API calls (same as legacy widget automation). */
test.describe("[API] VAK backend", () => {
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
    expect(token.token).toBeTruthy();
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

  test("stt endpoint transcribes uploaded english audio", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const result = await api.transcribeAudio(
      path.join(__dirname, "../data/stt/live-recording.opus"),
      { language: "en" },
    );
    expect(result.success).toBe(true);
    expect(result.text?.toLowerCase()).toContain("customer support");
  });

  test("tts endpoint returns audio for hindi voice", async () => {
    test.setTimeout(TIMEOUTS.TTS_PROCESSING);
    const result = await api.synthesizeSpeech("Namaste, yeh ek API test hai.", {
      voice: "Meera",
      language: "hi",
    });
    expect(result.byteLength).toBeGreaterThan(1000);
    expect(result.contentType).toMatch(/audio\//);
  });

  test("tts endpoint supports english voice selection", async () => {
    test.setTimeout(TIMEOUTS.TTS_PROCESSING);
    const result = await api.synthesizeSpeech("This is an English API test.", {
      voice: "Meera",
      language: "en",
    });
    expect(result.byteLength).toBeGreaterThan(1000);
  });

  test("tts endpoint returns audio for translated output", async () => {
    test.setTimeout(TIMEOUTS.TTS_PROCESSING);
    const translated = await api.translateText("नमस्ते", {
      sourceLang: "hi",
      targetLang: "en",
    });
    const audio = await api.synthesizeSpeech(translated.translated_text, {
      voice: "Meera",
      language: "en",
    });
    expect(audio.byteLength).toBeGreaterThan(1000);
  });
});
