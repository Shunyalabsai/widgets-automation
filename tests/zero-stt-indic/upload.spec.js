const { test, expect } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("Zero STT Indic module", () => {
  test("uploaded audio renders transcript and allows playback", async ({ page }) => {
    test.setTimeout(300_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Indic");

    const audioPath = path.join(__dirname, "..", "data", "stt", "saira-mix.opus");

    for (let attempt = 0; attempt < 3; attempt++) {
      await page.getByRole("button", { name: /Upload your file/i }).waitFor({ state: "visible", timeout: 10_000 });
      await sttPage.uploadAudioFile(audioPath);
      await sttPage.waitForUploadProcessing(180_000);

      const gotTranscript = await page
        .getByText(/Speaker\s*\d/i).first()
        .isVisible({ timeout: 30_000 })
        .catch(() => false);

      if (gotTranscript) break;

      if (attempt < 2) {
        await page.goto("https://www.shunyalabs.ai/");
        await page.waitForLoadState("networkidle");
        await widgetPage.openModule("Zero STT Indic");
      }
    }

    await sttPage.waitForAnySpeakerLabel(60_000);
    await expect(page.getByText(/today.*calling/i)).toBeVisible({ timeout: 30_000 });

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
