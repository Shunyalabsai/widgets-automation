const { test } = require("@playwright/test");
const path = require("path");
const { execSync } = require("child_process");
const { WidgetPage, WIDGET_HOST } = require("../pages/widget-page");
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

test.describe("Zero STT Codeswitch module", () => {
  test("simulated live recording validates transcript and speakers", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(widgetPage);

    await page.context().grantPermissions(["microphone"], {
      origin: "https://www.shunyalabs.ai",
    });
    await page.context().grantPermissions(["microphone"], {
      origin: `https://${WIDGET_HOST}`,
    });

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Codeswitch");

    await sttPage.startSpeaking();
    await sttPage.tryWaitForRecordingState(10_000);

    const audioPath = path.join(__dirname, "..", "data", "codeswitch", "live-recording.opus");
    const durationSeconds = getAudioDurationSeconds(audioPath) ?? 45;
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000) + 1500);
    await sttPage.stopSpeaking();
    await sttPage.tryWaitForProcessingState(30_000);

    await sttPage.uploadAudioFile(audioPath);
    await sttPage.waitForUploadProcessing(180_000);
    await sttPage.tryWaitForProcessingState(30_000);
    await sttPage.waitForTranscriptReady(180_000);

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
