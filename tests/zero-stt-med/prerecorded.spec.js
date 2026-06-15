const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");
const { TIMEOUTS } = require("../utils/timeouts");

test.describe("Zero STT Med module", () => {
  test("prerecorded patient notes renders transcript", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const widgetPage = new WidgetPage(page);
    const medPage = new MedicalTranscriptionPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Med");

    await medPage.selectPatientNotes();
    await medPage.playAudio();
    await medPage.waitForPlaybackToStart();
    await medPage.waitForTranscriptRows();
  });

  test("prerecorded doctor appointment renders transcript", async ({ page }) => {
    test.setTimeout(TIMEOUTS.TEST_MEDIUM);
    const widgetPage = new WidgetPage(page);
    const medPage = new MedicalTranscriptionPage(widgetPage);

    await widgetPage.goto();
    await widgetPage.openModule("Zero STT Med");

    await medPage.selectDoctorAppointment();
    await medPage.playAudio();
    await medPage.waitForPlaybackToStart();
    await medPage.waitForTranscriptRows();
  });
});
