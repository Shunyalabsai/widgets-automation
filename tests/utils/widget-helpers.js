const DEFAULT_WIDGET_URL = "https://www.shunyalabs.ai/";

async function gotoWidget(page) {
  const widgetUrl = process.env.WIDGET_URL || DEFAULT_WIDGET_URL;
  await page.goto(widgetUrl);
}

async function openSpeechToText(page) {
  await page.getByRole("button", { name: /Speech To Text/i }).click();
}

async function selectEnglishLanguage(page) {
  const englishTrigger = page.getByRole("button", { name: /English/i }).first();
  await englishTrigger.click();

  const englishOption = page.getByRole("button", { name: /English/i }).nth(1);
  await englishOption.waitFor();
  await englishOption.click();
}

async function selectCustomerSupportCall(page) {
  await page.getByRole("button", { name: /Customer Support Call/i }).click();
}

async function playAudio(page) {
  await page.getByRole("button", { name: /Play audio/i }).click();
}

async function waitForPlaybackToStart(page) {
  const pauseButton = page.getByRole("button", { name: /Pause audio/i });
  await pauseButton.waitFor();
}

async function waitForTranscriptSpeakers(page) {
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".flex.items-center.space-x-2").length > 0,
    null,
    { timeout: 90_000 },
  );

  const speakerLabels = page.getByText(/Speaker\s*\d/i);
  await speakerLabels.first().waitFor({ timeout: 90_000 });
}

async function copyConversation(page) {
  const copyButton = page.getByRole("button", { name: /Copy Conversation/i });
  await copyButton.waitFor();
  await copyButton.click();
}

module.exports = {
  gotoWidget,
  openSpeechToText,
  selectEnglishLanguage,
  selectCustomerSupportCall,
  playAudio,
  waitForPlaybackToStart,
  waitForTranscriptSpeakers,
  copyConversation,
};
