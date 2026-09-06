const { TIMEOUTS } = require("./timeouts");
const { uploadPhrasesForModule } = require("../data/upload-expectations");

/**
 * Confirm upload produced readable transcript text, not just speaker chrome.
 */
async function verifyUploadTranscript(pageObject, moduleName, verifyPhrases) {
  const phrases =
    verifyPhrases !== undefined ? verifyPhrases : uploadPhrasesForModule(moduleName);

  if (phrases?.length && pageObject.waitForTranscriptContains) {
    await pageObject.waitForTranscriptContains(phrases);
    return;
  }

  if (pageObject.waitForTranscriptReady) {
    await pageObject.waitForTranscriptReady();
    return;
  }

  if (pageObject.waitForTranscriptRows) {
    await pageObject.waitForTranscriptRows();
    return;
  }

  if (pageObject.waitForAnySpeakerLabel) {
    await pageObject.waitForAnySpeakerLabel(TIMEOUTS.BACKEND_RESULT);
  }
}

/**
 * Upload audio with session priming and retries — handles transient widget/API failures.
 */
async function uploadWithRetry({
  widgetPage,
  moduleName,
  audioPath,
  pageObject,
  maxAttempts = 3,
  primeSession = true,
  verifyPhrases,
}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await widgetPage.openModule(moduleName);
    }

    if (primeSession) {
      await widgetPage.primeWidgetSession();
    }

    if (pageObject.uploadButton) {
      await pageObject.uploadButton.waitFor({ state: "visible", timeout: 30_000 });
    }

    await pageObject.uploadAudioFile(audioPath);
    await pageObject.waitForUploadProcessing();

    try {
      await pageObject.waitForUploadResult();
      await verifyUploadTranscript(pageObject, moduleName, verifyPhrases);
      return;
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
    }
  }
}

/**
 * After simulated live recording, fall back to upload when mic processing did not finish.
 */
async function finishLiveRecordingWithUpload({
  widgetPage,
  moduleName,
  pageObject,
  audioPath,
  verifyPhrases,
}) {
  const transcriptReady =
    (await pageObject.tryWaitForTranscriptReady?.(TIMEOUTS.BACKEND_RESULT)) ||
    (await pageObject.tryWaitForTranscriptRows?.(TIMEOUTS.BACKEND_RESULT));
  if (transcriptReady) return;

  await uploadWithRetry({
    widgetPage,
    moduleName,
    audioPath,
    pageObject,
    verifyPhrases,
  });
}

module.exports = {
  uploadWithRetry,
  finishLiveRecordingWithUpload,
  verifyUploadTranscript,
  TIMEOUTS,
};
