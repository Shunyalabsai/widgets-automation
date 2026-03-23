const { test } = require("@playwright/test");
const path = require("path");
const { execSync } = require("child_process");
const { WidgetPage } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");

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

test.describe("Zero STT Med module", () => {
  test("live recording start/stop", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const medPage = new MedicalTranscriptionPage(page);

    await page.context().grantPermissions(["microphone"], {
      origin: "https://www.shunyalabs.ai",
    });

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Med");

    await medPage.startSpeaking();

    const audioPath = path.join(__dirname, "..", "data", "stt", "live-recording.opus");
    const durationSeconds = getAudioDurationSeconds(audioPath) ?? 45;
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000) + 1500);
    await medPage.stopSpeaking();

    await medPage.uploadAudioFile(audioPath);
    await medPage.waitForProcessingState(120_000);
    await medPage.waitForTranscriptRows(180_000);
  });
});
