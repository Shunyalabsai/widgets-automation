/** Prod playground backend routes (same as browser Network tab on www). */

const PLAYGROUND_API_PATHS = {
  speechToken: "/api/playground/speech/token",
  translate: "/api/playground/translate",
  ttsSpeech: "/api/playground/speech/tts/v1/audio/speech",
  wallet: "/api/console/wallet",
  asrTranscriptions: "/v1/audio/transcriptions",
};

const PROD_ASR_BASE = "https://asrv2prod.shunyalabs.ai";

function getPlaygroundApiConfig(env) {
  const origin = env.siteOrigin || env.siteUrl.replace(/\/$/, "");
  return {
    wwwOrigin: origin,
    asrBaseUrl: process.env.ASR_API_BASE_URL || env.asrApiUrl || PROD_ASR_BASE,
    paths: PLAYGROUND_API_PATHS,
    defaultSttModel: process.env.STT_MODEL || "zero-indic",
    defaultTtsModel: process.env.TTS_MODEL || "radiance-indic",
  };
}

module.exports = { PLAYGROUND_API_PATHS, PROD_ASR_BASE, getPlaygroundApiConfig };
