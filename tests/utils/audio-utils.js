const { execSync } = require("child_process");
const { TIMEOUTS } = require("./timeouts");

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

function getLiveRecordingWaitSeconds(filePath) {
  return getAudioDurationSeconds(filePath) ?? TIMEOUTS.LIVE_RECORDING_WAIT_SECONDS;
}

module.exports = { getAudioDurationSeconds, getLiveRecordingWaitSeconds };
