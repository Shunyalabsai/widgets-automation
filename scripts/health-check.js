const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { getEnvironment } = require("../tests/config/environment");
const {
  parseHealthReport,
  buildAutomationPipelineFailureRun,
} = require("./health-report");

const ROOT = path.resolve(__dirname, "..");
const HEALTH_DATA_PATH = path.join(ROOT, "docs", "data", "latest-health.json");
const HEALTH_REPORT_JSON = path.join(ROOT, "reports", "health-playwright-report.json");
const STT_FIXTURE = path.join(ROOT, "tests", "data", "stt", "live-recording.opus");

function assertHealthPrerequisites() {
  const env = getEnvironment();
  if (!env.apiBaseUrl.startsWith("https://")) {
    throw new Error(`Invalid API base URL for health check: ${env.apiBaseUrl}`);
  }
  if (!fs.existsSync(STT_FIXTURE)) {
    throw new Error(
      `Missing STT fixture for health check: ${STT_FIXTURE}. Commit tests/data/stt/live-recording.opus.`,
    );
  }
  if (process.env.SEND_HEALTH_ALERT === "1") {
    if (!process.env.EMAIL_WEB_APP_URL) {
      throw new Error("SEND_HEALTH_ALERT=1 but EMAIL_WEB_APP_URL is not set.");
    }
    if (!process.env.HEALTH_ALERT_RECIPIENT) {
      throw new Error("SEND_HEALTH_ALERT=1 but HEALTH_ALERT_RECIPIENT is not set.");
    }
  }
}

function saveHealthSummary(run) {
  fs.mkdirSync(path.dirname(HEALTH_DATA_PATH), { recursive: true });
  fs.writeFileSync(HEALTH_DATA_PATH, JSON.stringify(run, null, 2), "utf8");
  console.log(`Health summary saved: ${HEALTH_DATA_PATH}`);
}

function sendHealthAlert(runJsonPath) {
  const env = {
    ...process.env,
    HEALTH_RUN_JSON: runJsonPath,
  };
  execSync("node scripts/send-health-alert.js", {
    stdio: "inherit",
    env,
    cwd: ROOT,
  });
}

function main() {
  assertHealthPrerequisites();
  const env = getEnvironment();
  console.log(`API health check (${env.name}) → ${env.apiBaseUrl}`);

  fs.mkdirSync(path.dirname(HEALTH_REPORT_JSON), { recursive: true });
  if (fs.existsSync(HEALTH_REPORT_JSON)) {
    fs.unlinkSync(HEALTH_REPORT_JSON);
  }

  let playwrightFailed = false;
  try {
    execSync("npx playwright test --project=health", {
      stdio: "inherit",
      env: {
        ...process.env,
        HEALTH_REPORT_JSON: HEALTH_REPORT_JSON,
      },
      cwd: ROOT,
    });
  } catch {
    playwrightFailed = true;
  }

  let run;
  let parseError = null;
  try {
    run = parseHealthReport(HEALTH_REPORT_JSON);
    saveHealthSummary(run);
  } catch (error) {
    parseError = error;
    console.warn(parseError.message || parseError);
    run = buildAutomationPipelineFailureRun(
      parseError.message || "Could not read health test results from Playwright report.",
    );
    saveHealthSummary(run);
  }

  // Email only on failure — never when all checks passed (healthy: true).
  const shouldAlert =
    process.env.SEND_HEALTH_ALERT === "1" && run && run.healthy !== true;

  if (shouldAlert) {
    const alertPayloadPath = path.join(ROOT, "reports", "health-alert-run.json");
    fs.writeFileSync(alertPayloadPath, JSON.stringify(run, null, 2), "utf8");
    try {
      sendHealthAlert(alertPayloadPath);
    } catch (error) {
      console.error(error.message || error);
      process.exit(1);
    }
  }

  const failedRun = playwrightFailed || parseError || (run && run.healthy !== true);
  if (failedRun) {
    console.error("API health check failed.");
    process.exit(1);
  }

  console.log("API health check passed — no alert email (failures only).");
}

main();
