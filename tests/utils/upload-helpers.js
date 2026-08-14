const { TIMEOUTS } = require("./timeouts");

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
}) {
  const transcriptReady =
    (await pageObject.tryWaitForTranscriptReady?.(30_000)) ||
    (await pageObject.tryWaitForTranscriptRows?.(30_000));
  if (transcriptReady) return;

  await uploadWithRetry({
    widgetPage,
    moduleName,
    audioPath,
    pageObject,
  });
}

module.exports = { uploadWithRetry, finishLiveRecordingWithUpload, TIMEOUTS };
