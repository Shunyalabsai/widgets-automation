const liveRecording = require("./stt/live-recording-expected.json");

const DEFAULT_UPLOAD_PHRASES = liveRecording.keyPhrases.slice(0, 3);

const MODULE_UPLOAD_PHRASES = {
  "Zero STT Indic": DEFAULT_UPLOAD_PHRASES,
  "Zero STT JP/KR": DEFAULT_UPLOAD_PHRASES,
  "Zero STT Med": DEFAULT_UPLOAD_PHRASES,
  "Zero STT Codeswitch": null,
};

function uploadPhrasesForModule(moduleName) {
  if (Object.prototype.hasOwnProperty.call(MODULE_UPLOAD_PHRASES, moduleName)) {
    return MODULE_UPLOAD_PHRASES[moduleName];
  }
  return DEFAULT_UPLOAD_PHRASES;
}

module.exports = {
  DEFAULT_UPLOAD_PHRASES,
  MODULE_UPLOAD_PHRASES,
  uploadPhrasesForModule,
};
