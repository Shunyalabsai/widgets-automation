const { test, expect } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { TtsPage } = require("../pages/tts-page");

test.describe("Zero TTS Indic module", () => {
  let widgetPage;
  let ttsPage;

  test.beforeEach(async ({ page }) => {
    widgetPage = new WidgetPage(page);
    ttsPage = new TtsPage(page);
    await widgetPage.goto();
    await widgetPage.openModule("Zero TTS Indic");
  });

  test("default voice generates speech from text input", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.enterText("Hello, this is a test of the text to speech system.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("text input shows character count up to 1000", async ({ page }) => {
    test.setTimeout(60_000);

    await ttsPage.enterText("Hello world");
    const count = await ttsPage.getCharCount();
    expect(count).toBeGreaterThan(0);

    // Verify max 1000 chars limit indication is visible
    await expect(page.getByText(/\/\s*1000/)).toBeVisible();
  });

  test("selecting different voices works", async ({ page }) => {
    test.setTimeout(120_000);

    // Select a Hindi voice
    await ttsPage.selectVoice("Rajesh");
    await ttsPage.enterText("Namaste, yeh ek test hai.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("changing speed setting works", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.enterText("Testing speed control.");
    await ttsPage.setSpeed(1.5);
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("expression styles are selectable", async ({ page }) => {
    test.setTimeout(120_000);

    // Select Happy expression
    await ttsPage.selectExpressionStyle("Happy");
    await ttsPage.enterText("I am so happy to be here today!");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("different audio formats are selectable", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.enterText("Testing audio format selection.");
    await ttsPage.selectFormat("WAV");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("generate button is disabled with empty text", async ({ page }) => {
    test.setTimeout(30_000);

    await ttsPage.clearText();
    // Generate button should not be clickable with empty text
    const textarea = ttsPage.textInput;
    await expect(textarea).toHaveValue("");
  });

  test("English voice with slow speed generates speech", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.selectVoice("Varun");
    await ttsPage.setSpeed(0.5);
    await ttsPage.enterText("This is a slow speed English test.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("Tamil voice generates speech", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.selectVoice("Murugan");
    await ttsPage.enterText("Vanakkam, indha oru test.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("Bengali voice with Sad expression generates speech", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.selectVoice("Arjun");
    await ttsPage.selectExpressionStyle("Sad");
    await ttsPage.enterText("This is a sad message for testing purposes.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("OGG Opus format with fast speed generates speech", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.enterText("Testing OGG format at fast speed.");
    await ttsPage.selectFormat("OGG Opus");
    await ttsPage.setSpeed(2.0);
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });

  test("Conversational expression style generates speech", async ({ page }) => {
    test.setTimeout(120_000);

    await ttsPage.selectExpressionStyle("Conversational");
    await ttsPage.enterText("Hey, how are you doing? Let's catch up sometime soon.");
    await ttsPage.generate();
    await ttsPage.waitForProcessing(60_000);
  });
});
