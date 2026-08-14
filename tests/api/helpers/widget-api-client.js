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
}

module.exports = { WidgetApiClient };
