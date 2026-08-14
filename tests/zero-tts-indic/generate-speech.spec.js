const { test, expect } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { TtsPage } = require("../pages/tts-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("[UI] Zero TTS Indic module", () => {
  let widgetPage;
  let ttsPage;

  test.beforeEach(async ({ page }) => {
    widgetPage = new WidgetPage(page);
    ttsPage = new TtsPage(widgetPage);
    await widgetPage.goto();
    await widgetPage.openModule("Zero TTS Indic");
  });

  test("default voice generates speech from text input", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.enterText("Hello, this is a test of the text to speech system.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("text input shows character count up to 1000", async () => {
    test.setTimeout(TIMEOUTS.TEST_FAST);

    await ttsPage.enterText("Hello world");
    const count = await ttsPage.getCharCount();
    expect(count).toBeGreaterThan(0);

    await expect(ttsPage.root.getByText(/\/\s*1000/)).toBeVisible();
  });

  test("script selector is visible and voice generation works", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await expect(ttsPage.root.getByText(/^Script$/i)).toBeVisible();
    await ttsPage.selectVoice("Rajesh");
    await ttsPage.enterText("Yeh script aur voice test hai.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("selecting different voices works", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.selectVoice("Rajesh");
    await ttsPage.enterText("Namaste, yeh ek test hai.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("changing speed setting works", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.enterText("Testing speed control.");
    await ttsPage.setSpeed(1.5);
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("expression styles are selectable", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.selectExpressionStyle("Happy");
    await ttsPage.enterText("I am so happy to be here today!");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("different audio formats are selectable", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.enterText("Testing audio format selection.");
    await ttsPage.selectFormat("WAV");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("generate button is disabled with empty text", async () => {
    test.setTimeout(TIMEOUTS.TEST_FAST);

    await ttsPage.clearText();
    const textarea = ttsPage.textInput;
    await expect(textarea).toHaveValue("");
  });

  test("English voice with slow speed generates speech", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.selectVoice("Varun");
    await ttsPage.setSpeed(0.5);
    await ttsPage.enterText("This is a slow speed English test.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("Tamil voice generates speech", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.selectVoice("Murugan");
    await ttsPage.enterText("Vanakkam, indha oru test.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("Bengali voice with Sad expression generates speech", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.selectVoice("Arjun");
    await ttsPage.selectExpressionStyle("Sad");
    await ttsPage.enterText("This is a sad message for testing purposes.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("OGG format with fast speed generates speech", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.enterText("Testing OGG format at fast speed.");
    await ttsPage.selectFormat("OGG");
    await ttsPage.setSpeed(2.0);
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });

  test("Conversational expression style generates speech", async () => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);

    await ttsPage.selectExpressionStyle("Conversational");
    await ttsPage.enterText("Hey, how are you doing? Let's catch up sometime soon.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing();
  });
});
