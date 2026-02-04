const { test } = require("@playwright/test");
const path = require("path");
const { WidgetPage } = require("../pages/widget-page");
const { CodeswitchPage } = require("../pages/codeswitch-page");

test.describe("CodeSwitch module", () => {
  test("upload file renders codeswitched transcript", async ({ page }) => {
    test.setTimeout(180_000);
    const widgetPage = new WidgetPage(page);
    const codeswitchPage = new CodeswitchPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Codeswitch");

    const audioPath = path.join(
      __dirname,
      "..",
      "data",
      "codeswitch",
      "saira-hignlish.opus",
    );
    await codeswitchPage.uploadAudioFile(audioPath);
    await codeswitchPage.waitForProcessingState(120_000);

    await codeswitchPage.waitForSpeakerLabel("Speaker 1", 180_000);
    await codeswitchPage.waitForTranscriptSnippetNormalized(
      "मैं सीरिसली बॉत फ्रेस्टेटेड हो चुकी हूँ इस साविस बिल्कुल बक्वास से और कुछ भी प्रोपली काम नहीं करता मैंने लास्ट वीक एक एक order प्लेस किया था बत आभी तक देलिवरी नही हुई हूई हर बार करती हूं तो कोई ना कोई useless excuse देते हो honestly this is so irritating I am done with this nonsense मेरा order 5554 है और मुझे मेरा फूल रिफन चाएए I don't want to hear anymore bullshit excuses please सम्जो पैशेंट्स भी एक लिमिट तक होता है",
      180_000,
    );

    await codeswitchPage.assertCopyAvailable();
  });
});
