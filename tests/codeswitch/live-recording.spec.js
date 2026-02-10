const { test } = require("@playwright/test");
const path = require("path");
const { execSync } = require("child_process");
const { WidgetPage } = require("../pages/widget-page");
const { CodeswitchPage } = require("../pages/codeswitch-page");

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

test.describe("CodeSwitch module", () => {
  test("simulated live recording validates transcript and speakers", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const codeswitchPage = new CodeswitchPage(page);

    await page.context().grantPermissions(["microphone"], {
      origin: "https://www.shunyalabs.ai",
    });

    await widgetPage.goto();
    await widgetPage.openModule("Codeswitch");

    await codeswitchPage.startSpeaking();
    await codeswitchPage.tryWaitForRecordingState(10_000);

    const audioPath = path.join(
      __dirname,
      "..",
      "data",
      "codeswitch",
      "live-recording.opus",
    );
    const durationSeconds = getAudioDurationSeconds(audioPath) ?? 35;
    await page.waitForTimeout(Math.ceil(durationSeconds * 1000) + 1500);
    await codeswitchPage.stopSpeaking();
    await codeswitchPage.tryWaitForProcessingState(30_000);

    await codeswitchPage.uploadAudioFile(audioPath);
    await codeswitchPage.waitForUploadProcessing(180_000);
    await codeswitchPage.tryWaitForProcessingState(30_000);
    await codeswitchPage.waitForTranscriptRows(180_000);
    await codeswitchPage.waitForAnySpeakerLabel(180_000);

    await codeswitchPage.assertCopyAvailable();
  });
});
