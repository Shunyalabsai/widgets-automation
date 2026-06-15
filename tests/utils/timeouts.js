/** Shared timeouts — tuned for slow CI / backend processing. */
const TIMEOUTS = {
  /** Quick UI-only checks (e.g. TTS input validation). */
  TEST_FAST: 60_000,
  /** Prerecorded playback and sample-audio flows. */
  TEST_MEDIUM: 240_000,
  /** Upload, live-recording, and multi-step backend flows. */
  TEST_SLOW: 360_000,
  /** Wait for upload spinner / loader to finish. */
  UPLOAD_PROCESSING: 240_000,
  /** Wait for transcript rows, speakers, or upload result. */
  BACKEND_RESULT: 240_000,
  /** TTS audio generation. */
  TTS_PROCESSING: 90_000,
  /** Simulated mic recording length when ffprobe is unavailable. */
  LIVE_RECORDING_WAIT_SECONDS: 45,
};

module.exports = { TIMEOUTS };
