const { test } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("STT module", () => {
  test("simulated live recording uses file and verifies transcript", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Speech To Text");

    await sttPage.startSpeaking();
    await sttPage.waitForRecordingState(60_000);
    await sttPage.stopSpeaking();
    await sttPage.waitForProcessingState(120_000);

    const audioPath = path.join(
      __dirname,
      "..",
      "data",
      "stt",
      "live-recording.opus",
    );
    await sttPage.uploadAudioFile(audioPath);
    await sttPage.waitForUploadProcessing(180_000);

    const expectedPath = path.join(
      __dirname,
      "..",
      "data",
      "stt",
      "live-recording-expected.json",
    );
    const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
    await sttPage.waitForTranscriptContains(expected.lines, 180_000);

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
