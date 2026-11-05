const fs = require("fs");
const path = require("path");
const { request } = require("@playwright/test");
const { getEnvironment } = require("../../config/environment");
const { getPlaygroundApiConfig } = require("../../config/playground-api");

const AUTH_FILE = path.resolve(__dirname, "../../../.auth/playground.json");

class WidgetApiClient {
  constructor(options = {}) {
    this.env = getEnvironment();
    this.apiConfig = getPlaygroundApiConfig(this.env);
    this.wwwOrigin = options.wwwOrigin || this.apiConfig.wwwOrigin;
    this.asrBaseUrl = options.asrBaseUrl || this.apiConfig.asrBaseUrl;
    this.wwwContext = null;
    this.asrContext = null;
    this.bearerToken = null;
  }

  async init() {
    if (!this.wwwContext) {
      const storageState = fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined;
      this.wwwContext = await request.newContext({
        baseURL: this.wwwOrigin,
        storageState,
      });
    }
    if (!this.asrContext) {
      this.asrContext = await request.newContext({ baseURL: this.asrBaseUrl });
    }
    return this;
  }

  async dispose() {
    for (const ctx of [this.wwwContext, this.asrContext]) {
      if (ctx) await ctx.dispose();
    }
    this.wwwContext = null;
    this.asrContext = null;
  }

  authHeaders() {
    return this.bearerToken ? { Authorization: `Bearer ${this.bearerToken}` } : {};
  }

  async issueToken() {
    await this.init();
    const response = await this.wwwContext.get(this.apiConfig.paths.speechToken);
    const body = await response.json().catch(() => ({}));
    if (!response.ok() || !body.token) {
      throw new Error(
        `[API] Speech token failed (${response.status()}): ${JSON.stringify(body).slice(0, 300)}`,
      );
    }
    this.bearerToken = body.token;
    return { token: body.token, ...body };
  }

  async ensureToken() {
    if (!this.bearerToken) {
      await this.issueToken();
    }
    return this.bearerToken;
  }

  async transcribeAudio(filePath, { language = "en", model } = {}) {
    await this.ensureToken();
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const response = await this.asrContext.post(this.apiConfig.paths.asrTranscriptions, {
      headers: this.authHeaders(),
      multipart: {
        file: {
          name: fileName,
          mimeType: fileName.endsWith(".opus") ? "audio/opus" : "audio/mpeg",
          buffer,
        },
        model: model || this.apiConfig.defaultSttModel,
        language_code: language,
      },
    });
    const bodyText = await response.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = { raw: bodyText };
    }
    if (!response.ok()) {
      throw new Error(`[API] STT failed (${response.status()}): ${bodyText.slice(0, 500)}`);
    }
    const text = body.text || body.transcript?.text || "";
    const success = text.length > 0;
    return { ...body, text, success };
  }

  async translateText(text, { sourceLang = "hi", targetLang = "en" } = {}) {
    await this.init();
    const response = await this.wwwContext.post(this.apiConfig.paths.translate, {
      data: {
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
      },
    });
    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`[API] Translate failed (${response.status()}): ${JSON.stringify(body)}`);
    }
    return body;
  }

  async synthesizeSpeech(text, options = {}) {
    await this.init();
    const payload = {
      input: text,
      model: options.model || this.apiConfig.defaultTtsModel,
      language: options.language || "en",
      response_format: options.format || "wav",
      quality: options.quality || "medium",
      latex: false,
      voice: options.speaker || options.voice || "Meera",
    };
    const response = await this.wwwContext.post(this.apiConfig.paths.ttsSpeech, { data: payload });
    if (!response.ok()) {
      const errText = await response.text();
      throw new Error(`[API] TTS failed (${response.status()}): ${errText.slice(0, 500)}`);
    }
    const contentType = response.headers()["content-type"] || "";
    const audioBuffer = await response.body();
    if (audioBuffer.length <= 1000) {
      const preview = audioBuffer.slice(0, 200).toString("utf8");
      throw new Error(
        `[API] TTS returned too little audio (${audioBuffer.length} bytes, ${contentType}): ${preview}`,
      );
    }
    return { contentType, byteLength: audioBuffer.length, buffer: audioBuffer };
  }

  async healthCheckToken() {
    await this.init();
    const start = Date.now();
    const response = await this.wwwContext.get(this.apiConfig.paths.speechToken);
    const latencyMs = Date.now() - start;
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    if (response.ok() && body.token) {
      this.bearerToken = body.token;
    }
    return {
      ok: response.ok() && Boolean(body.token),
      status: response.status(),
      latencyMs,
      browserId: body.token ? "jwt" : "",
      detail: response.ok()
        ? `token ${latencyMs}ms`
        : `token failed (${response.status()}): ${JSON.stringify(body).slice(0, 200)}`,
    };
  }

  async healthCheckTranslate(text, { sourceLang = "hi", targetLang = "en" } = {}) {
    await this.init();
    const start = Date.now();
    const response = await this.wwwContext.post(this.apiConfig.paths.translate, {
      data: { text, source_lang: sourceLang, target_lang: targetLang },
    });
    const latencyMs = Date.now() - start;
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    const translated = body.translated_text || "";
    return {
      ok: response.ok() && translated.length > 0,
      status: response.status(),
      latencyMs,
      detail: response.ok()
        ? `translate ${latencyMs}ms`
        : `translate failed (${response.status()}): ${JSON.stringify(body).slice(0, 200)}`,
    };
  }

  async healthCheckStt(filePath, { language = "en" } = {}) {
    await this.init();
    await this.ensureToken();
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const start = Date.now();
    const response = await this.asrContext.post(this.apiConfig.paths.asrTranscriptions, {
      headers: this.authHeaders(),
      multipart: {
        file: {
          name: fileName,
          mimeType: fileName.endsWith(".opus") ? "audio/opus" : "audio/mpeg",
          buffer,
        },
        model: this.apiConfig.defaultSttModel,
        language_code: language,
      },
    });
    const latencyMs = Date.now() - start;
    const bodyText = await response.text();
    let body = {};
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = { raw: bodyText };
    }
    const text = body.text || "";
    return {
      ok: response.ok() && text.length > 0,
      status: response.status(),
      latencyMs,
      textLength: text.length,
      detail: response.ok()
        ? `stt ${latencyMs}ms`
        : `stt failed (${response.status()}): ${bodyText.slice(0, 200)}`,
    };
  }

  async healthCheckTts(text, options = {}) {
    await this.init();
    const payload = {
      input: text,
      model: options.model || this.apiConfig.defaultTtsModel,
      language: options.language || "en",
      response_format: "wav",
      quality: "medium",
      latex: false,
      voice: options.voice || "Meera",
    };
    const start = Date.now();
    const response = await this.wwwContext.post(this.apiConfig.paths.ttsSpeech, { data: payload });
    const latencyMs = Date.now() - start;
    if (!response.ok()) {
      const errText = await response.text();
      return {
        ok: false,
        status: response.status(),
        latencyMs,
        byteLength: 0,
        detail: `tts failed (${response.status()}): ${errText.slice(0, 200)}`,
      };
    }
    const buffer = await response.body();
    return {
      ok: buffer.length > 0,
      status: response.status(),
      latencyMs,
      byteLength: buffer.length,
      detail: `tts ${latencyMs}ms`,
    };
  }
}

module.exports = { WidgetApiClient };
