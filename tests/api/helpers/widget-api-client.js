const fs = require("fs");
const path = require("path");
const { request } = require("@playwright/test");
const { getEnvironment } = require("../../config/environment");

class WidgetApiClient {
  constructor(options = {}) {
    this.env = getEnvironment();
    this.baseUrl = options.baseUrl || this.env.apiBaseUrl;
    this.context = null;
    this.browserId = null;
  }

  async init() {
    if (!this.context) {
      this.context = await request.newContext({ baseURL: this.baseUrl });
    }
    return this;
  }

  async dispose() {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }

  async issueToken() {
    await this.init();
    const response = await this.context.post("/api/vak/token", { data: {} });
    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`[API] Token request failed (${response.status()}): ${JSON.stringify(body)}`);
    }
    this.browserId = body.browser_id;
    return body;
  }

  async ensureToken() {
    if (!this.browserId) {
      await this.issueToken();
    }
    return this.browserId;
  }

  authHeaders() {
    return this.browserId ? { "X-Browser-Id": this.browserId } : {};
  }

  async transcribeAudio(filePath, { language = "en", domain } = {}) {
    await this.ensureToken();
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const multipart = {
      file: {
        name: fileName,
        mimeType: fileName.endsWith(".opus") ? "audio/opus" : "audio/mpeg",
        buffer,
      },
      language,
    };
    if (domain) multipart.domain = domain;

    const response = await this.context.post("/api/vak/stt", {
      multipart,
      headers: this.authHeaders(),
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
    return body;
  }

  async translateText(text, { sourceLang = "hi", targetLang = "en" } = {}) {
    await this.ensureToken();
    const response = await this.context.post("/api/vak/translate", {
      data: {
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
      },
      headers: this.authHeaders(),
    });
    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`[API] Translate failed (${response.status()}): ${JSON.stringify(body)}`);
    }
    return body;
  }

  async synthesizeSpeech(text, options = {}) {
    await this.ensureToken();
    const payload = {
      text,
      speaker: options.speaker || "Rajesh",
      emotion: options.emotion || "Neutral",
      style: options.style || "Neutral",
      expression_style: options.expressionStyle || "Neutral",
      language: options.language || "hi",
      format: options.format || "mp3",
      speed: options.speed ?? 1,
    };
    const response = await this.context.post("/api/vak/tts", {
      data: payload,
      headers: this.authHeaders(),
    });
    if (!response.ok()) {
      const errText = await response.text();
      throw new Error(`[API] TTS failed (${response.status()}): ${errText.slice(0, 500)}`);
    }
    const contentType = response.headers()["content-type"] || "";
    const audioBuffer = await response.body();
    return { contentType, byteLength: audioBuffer.length, buffer: audioBuffer };
  }

  async fetchSampleTranscript(fileName) {
    await this.init();
    const response = await this.context.get(`/data/transcriptions/${fileName}`);
    const body = await response.json();
    if (!response.ok()) {
      throw new Error(`[API] Sample transcript fetch failed (${response.status()}): ${fileName}`);
    }
    return body;
  }

  async fetchSampleAudio(fileName) {
    await this.init();
    const response = await this.context.get(`/data/audio/${fileName}`);
    if (!response.ok()) {
      throw new Error(`[API] Sample audio fetch failed (${response.status()}): ${fileName}`);
    }
    return response.body();
  }

  async healthCheckToken() {
    await this.init();
    const start = Date.now();
    const response = await this.context.post("/api/vak/token", { data: {} });
    const latencyMs = Date.now() - start;
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    if (response.ok() && body.browser_id) {
      this.browserId = body.browser_id;
    }
    return {
      ok: response.ok() && Boolean(body.browser_id),
      status: response.status(),
      latencyMs,
      browserId: body.browser_id || "",
      detail: response.ok()
        ? `token ${latencyMs}ms`
        : `token failed (${response.status()}): ${JSON.stringify(body).slice(0, 200)}`,
    };
  }

  async healthCheckTranslate(text, { sourceLang = "hi", targetLang = "en" } = {}) {
    await this.init();
    const start = Date.now();
    const response = await this.context.post("/api/vak/translate", {
      data: { text, source_lang: sourceLang, target_lang: targetLang },
      headers: this.authHeaders(),
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
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const start = Date.now();
    const response = await this.context.post("/api/vak/stt", {
      multipart: {
        file: {
          name: fileName,
          mimeType: fileName.endsWith(".opus") ? "audio/opus" : "audio/mpeg",
          buffer,
        },
        language,
      },
      headers: this.authHeaders(),
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
      text,
      speaker: options.speaker || "Varun",
      emotion: "Neutral",
      style: "Neutral",
      expression_style: "Neutral",
      language: options.language || "en",
      format: "mp3",
      speed: 1,
    };
    const start = Date.now();
    const response = await this.context.post("/api/vak/tts", {
      data: payload,
      headers: this.authHeaders(),
    });
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

  async healthCheckSampleTranscript(fileName) {
    await this.init();
    const start = Date.now();
    const response = await this.context.get(`/data/transcriptions/${fileName}`);
    const latencyMs = Date.now() - start;
    return {
      ok: response.ok(),
      status: response.status(),
      latencyMs,
      detail: response.ok()
        ? `asset ${latencyMs}ms`
        : `asset failed (${response.status()}): ${fileName}`,
    };
  }
}

module.exports = { WidgetApiClient };
