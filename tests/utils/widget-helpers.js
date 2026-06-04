const DEFAULT_WIDGET_URL = "https://www.shunyalabs.ai/";
const WIDGET_HOST = "stage-widget.shunyalabs.ai";

const MODULE_WIDGET_SLUGS = {
  "zero tts indic": "zero-tts-indic",
  "zero stt codeswitch": "zero-stt-codeswitch",
  "zero stt indic": "zero-stt-indic",
  "zero stt med": "zero-stt-med",
};

async function gotoWidget(page) {
  const widgetUrl = process.env.WIDGET_URL || DEFAULT_WIDGET_URL;
  await page.goto(widgetUrl, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: /Zero TTS Indic|Zero STT Indic/i })
    .first()
    .waitFor({ timeout: 30_000 });
}

async function openWidgetModule(page, moduleName) {
  const slug = MODULE_WIDGET_SLUGS[moduleName.trim().toLowerCase()];
  if (!slug) {
    throw new Error(`Unknown widget module: ${moduleName}`);
  }

  await page.getByRole("button", { name: new RegExp(moduleName, "i") }).click();
  await page.waitForFunction(
    (expectedSlug) =>
      Array.from(document.querySelectorAll("iframe")).some((iframe) =>
        iframe.src.includes(`widget=${expectedSlug}`),
      ),
    slug,
    { timeout: 30_000 },
  );

  let frame = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    frame = page.frames().find((candidate) => candidate.url().includes(`widget=${slug}`));
    if (frame) break;
    await page.waitForTimeout(500);
  }

  if (!frame) {
    throw new Error(`Widget iframe not found for module: ${moduleName}`);
  }

  return frame;
}

async function openSpeechToText(page) {
  await openWidgetModule(page, "Zero STT Indic");
}

async function selectEnglishLanguage(page) {
  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes("widget=zero-stt-indic"));
  const root = frame || page;
  const englishTrigger = root.getByRole("button", { name: /English/i }).first();
  await englishTrigger.click();

  const englishOption = root.getByRole("button", { name: /English/i }).nth(1);
  await englishOption.waitFor();
  await englishOption.click();
}

async function selectCustomerSupportCall(page) {
  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes("widget=zero-stt-indic"));
  const root = frame || page;
  await root.getByRole("button", { name: /Customer Support Call/i }).click();
}

async function playAudio(page) {
  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes("widget="));
  const root = frame || page;
  await root.getByRole("button", { name: /Play audio/i }).click();
}

async function waitForPlaybackToStart(page) {
  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes("widget="));
  const root = frame || page;
  const pauseButton = root.getByRole("button", { name: /Pause audio/i });
  await pauseButton.waitFor();
}

async function waitForTranscriptSpeakers(page) {
  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes("widget="));
  const root = frame || page;

  await root.waitForFunction(
    () =>
      document.querySelectorAll(".flex.items-center.space-x-2").length > 0,
    null,
    { timeout: 90_000 },
  );

  const speakerLabels = root.getByText(/Speaker\s*\d/i);
  await speakerLabels.first().waitFor({ timeout: 90_000 });
}

async function copyConversation(page) {
  const frame = page
    .frames()
    .find((candidate) => candidate.url().includes("widget="));
  const root = frame || page;
  const copyButton = root.getByRole("button", { name: /Copy Conversation/i });
  await copyButton.waitFor();
  await copyButton.click();
}

module.exports = {
  DEFAULT_WIDGET_URL,
  WIDGET_HOST,
  gotoWidget,
  openWidgetModule,
  openSpeechToText,
  selectEnglishLanguage,
  selectCustomerSupportCall,
  playAudio,
  waitForPlaybackToStart,
  waitForTranscriptSpeakers,
  copyConversation,
};
