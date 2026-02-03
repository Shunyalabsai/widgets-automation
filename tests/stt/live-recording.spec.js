const { test } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

function getAudioDurationSeconds(filePath) {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${filePath}"`,
      { encoding: "utf8" },
    ).trim();
    const value = Number.parseFloat(output);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

test.describe("STT module", () => {
  test("simulated live recording uses file and verifies transcript", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(page);

    await page.context().grantPermissions(["microphone"], {
      origin: "https://www.shunyalabs.ai",
    });

    await widgetPage.goto();
    await widgetPage.openModule("Speech To Text");

    await sttPage.startSpeaking();
    await sttPage.tryWaitForRecordingState(10_000);

    const audioPath = path.join(
      __dirname,
      "..",
      "data",
      "stt",
      "live-recording.opus",
    );
    const durationSeconds = getAudioDurationSeconds(audioPath) ?? 45;
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000) + 1500);
    await sttPage.stopSpeaking();
    await sttPage.waitForProcessingState(120_000);

    await sttPage.uploadAudioFile(audioPath);
    await sttPage.waitForUploadProcessing(180_000);
    await sttPage.waitForProcessingState(120_000);

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
