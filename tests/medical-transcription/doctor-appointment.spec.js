const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { MedicalTranscriptionPage } = require("../pages/medical-transcription-page");

test.describe("Medical Transcription module", () => {
  test("prerecorded doctor appointment renders transcript", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const medicalPage = new MedicalTranscriptionPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Medical Transcription");

    await medicalPage.selectDoctorAppointment();
    await medicalPage.playAudio();
    await medicalPage.copyConversation();

    await medicalPage.waitForTranscriptRows(180_000);
  });
});
