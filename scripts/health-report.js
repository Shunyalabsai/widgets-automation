const fs = require("fs");
const path = require("path");
const { getEnvironment } = require("../tests/config/environment");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_REPORT_JSON = path.join(ROOT, "reports", "playwright-report.json");
const EXPECTED_HEALTH_CHECK_COUNT = 6;

const CHECK_META = {
  "token endpoint is reachable": {
    label: "Token API",
    endpoint: "POST /api/vak/token",
  },
  "translate endpoint is reachable": {
    label: "Translate API",
    endpoint: "POST /api/vak/translate",
  },
  "stt endpoint is reachable": {
    label: "STT API",
    endpoint: "POST /api/vak/stt",
    note: "Smoke: sample audio upload (live-recording.opus)",
  },
  "tts endpoint is reachable": {
    label: "TTS API",
    endpoint: "POST /api/vak/tts",
  },
  "sample transcript asset is reachable": {
    label: "Static assets",
    endpoint: "GET /data/transcriptions/...",
  },
  "reports environment under test": {
    label: "Environment",
    endpoint: "config",
  },
};

function resolveReportPath() {
  const fromEnv = process.env.HEALTH_REPORT_JSON;
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(ROOT, fromEnv);
  }
  return DEFAULT_REPORT_JSON;
}

function isHealthTestFile(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return normalized.includes("api/health/");
}

function humanizeHealthError(raw) {
  if (!raw) return "";
  const text = String(raw).replace(/\u001b\[[0-9;]*m/g, "").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/failed \(\d+\)|^token |^translate |^stt |^tts |^asset /i.test(line)) {
      return line.replace(/^Error:\s*/i, "").slice(0, 280);
    }
  }
  const expectLine = lines.find((l) => l.startsWith("Error:")) || lines[0] || text;
  return expectLine.replace(/^Error:\s*/i, "").slice(0, 280);
}

function collectTestsFromSuite(suite, parentTitles = [], fileHint = "") {
  const tests = [];
  const titleParts = suite.title ? [...parentTitles, suite.title] : parentTitles;
  const filePath = suite.file || fileHint;

  for (const spec of suite.specs || []) {
    const specTitle = spec.title ? [...titleParts, spec.title].join(" > ") : titleParts.join(" > ");
    const leafTitle = spec.title || "";
    for (const test of spec.tests || []) {
      const results = test.results || [];
      const lastResult = results[results.length - 1] || {};
      tests.push({
        title: leafTitle || test.title || specTitle,
        status: lastResult.status || test.expectedStatus || "unknown",
        error: lastResult.error
          ? String(lastResult.error.message || lastResult.error.stack || "")
          : "",
        file: spec.file || filePath,
      });
    }
  }
  for (const child of suite.suites || []) {
    tests.push(...collectTestsFromSuite(child, titleParts, filePath));
  }
  return tests;
}

function parseHealthReport(reportPath = resolveReportPath()) {
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Playwright report not found: ${reportPath}. Run health checks first.`);
  }
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const tests = [];
  for (const suite of report.suites || []) {
    tests.push(...collectTestsFromSuite(suite));
  }
  const healthTests = tests.filter((t) => isHealthTestFile(t.file));
  if (healthTests.length === 0) {
    throw new Error(
      "No health test results in Playwright report. Expected tests under tests/api/health/.",
    );
  }
  if (healthTests.length !== EXPECTED_HEALTH_CHECK_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_HEALTH_CHECK_COUNT} health checks in report, found ${healthTests.length}.`,
    );
  }

  const env = getEnvironment();
  const startedAt = report.startTime || new Date().toISOString();

  const checks = healthTests.map((test) => {
    const meta = CHECK_META[test.title] || {
      label: test.title,
      endpoint: "—",
    };
    return {
      name: meta.label,
      endpoint: meta.endpoint,
      note: meta.note || "",
      status: test.status,
      error: humanizeHealthError(test.error),
    };
  });

  const failed = checks.filter((c) => c.status === "failed" || c.status === "timedOut").length;
  const passed = checks.filter((c) => c.status === "passed").length;

  return {
    startedAt,
    environment: env.name,
    siteUrl: env.siteUrl,
    apiBaseUrl: env.apiBaseUrl,
    passed,
    failed,
    total: checks.length,
    healthy: failed === 0,
    checks,
    reportPath,
  };
}

function buildAutomationPipelineFailureRun(message) {
  const env = getEnvironment();
  return {
    startedAt: new Date().toISOString(),
    environment: env.name,
    siteUrl: env.siteUrl,
    apiBaseUrl: env.apiBaseUrl,
    passed: 0,
    failed: 1,
    total: 1,
    healthy: false,
    pipelineFailure: true,
    checks: [
      {
        name: "Health monitoring pipeline",
        endpoint: "automation",
        note: "This row means the health job failed before a full API result table could be built.",
        status: "failed",
        error: message,
      },
    ],
  };
}

function sampleFailedHealthRun() {
  const env = getEnvironment();
  return {
    startedAt: new Date().toISOString(),
    environment: env.name,
    siteUrl: env.siteUrl,
    apiBaseUrl: env.apiBaseUrl,
    passed: 4,
    failed: 2,
    total: 6,
    healthy: false,
    checks: [
      {
        name: "Token API",
        endpoint: "POST /api/vak/token",
        note: "",
        status: "passed",
        error: "",
      },
      {
        name: "Translate API",
        endpoint: "POST /api/vak/translate",
        note: "",
        status: "passed",
        error: "",
      },
      {
        name: "STT API",
        endpoint: "POST /api/vak/stt",
        note: "Smoke: sample audio upload (live-recording.opus)",
        status: "failed",
        error: "stt failed (503): Service temporarily unavailable",
      },
      {
        name: "TTS API",
        endpoint: "POST /api/vak/tts",
        note: "",
        status: "passed",
        error: "",
      },
      {
        name: "Static assets",
        endpoint: "GET /data/transcriptions/...",
        note: "",
        status: "failed",
        error: "asset failed (503): speech-to-text-en.json",
      },
      {
        name: "Environment",
        endpoint: "config",
        note: "",
        status: "passed",
        error: "",
      },
    ],
  };
}

module.exports = {
  parseHealthReport,
  sampleFailedHealthRun,
  buildAutomationPipelineFailureRun,
  CHECK_META,
  EXPECTED_HEALTH_CHECK_COUNT,
  resolveReportPath,
};
