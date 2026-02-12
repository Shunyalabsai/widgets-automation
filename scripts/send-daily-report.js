const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const HISTORY_PATH = path.join(ROOT, "docs", "history", "runs.json");

function getDateKey(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatDate(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) {
    throw new Error("Run history not found. Ensure docs/history/runs.json exists.");
  }
  const raw = fs.readFileSync(HISTORY_PATH, "utf8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function summarizeRuns(runs) {
  const summary = {
    totalRuns: runs.length,
    totalPassed: 0,
    totalFailed: 0,
    modules: {},
  };

  runs.forEach((run) => {
    summary.totalPassed += run.summary?.passed ?? 0;
    summary.totalFailed += run.summary?.failed ?? 0;
    const modules = run.modules || {};
    Object.entries(modules).forEach(([name, stats]) => {
      if (!summary.modules[name]) {
        summary.modules[name] = { passed: 0, failed: 0 };
      }
      summary.modules[name].passed += stats.passed ?? 0;
      summary.modules[name].failed += stats.failed ?? 0;
    });
  });

  return summary;
}

function buildEmailBody({
  projectName,
  summary,
  dashboardUrl,
  reportDate,
}) {
  const passLines = Object.entries(summary.modules)
    .map(([name, stats]) => `\t•\t${name} – ${stats.passed} Passed`)
    .join("\n");
  const failLines = Object.entries(summary.modules)
    .map(([name, stats]) => `\t•\t${name} – ${stats.failed} Failed`)
    .join("\n");

  return [
    "Hi Team,",
    "",
    `Project: ${projectName}`,
    "",
    `Total Runs: ${summary.totalRuns}`,
    `Total Passed: ${summary.totalPassed}`,
    `Total Failed: ${summary.totalFailed}`,
    "",
    "Module-wise Summary:",
    "",
    "Pass:",
    passLines || "\t•\tNone",
    "",
    "Fail:",
    failLines || "\t•\tNone",
    "",
    "For more details, follow the link:",
    dashboardUrl,
    "",
    "Thanks & Regards,",
    "Saira Automation BOT",
  ].join("\n");
}

async function sendEmail({ url, to, subject, body }) {
  if (!url) throw new Error("EMAIL_WEB_APP_URL is not set.");
  if (!to) throw new Error("REPORT_RECIPIENTS is not set.");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, body }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email send failed: ${response.status} ${text}`);
  }
}

async function main() {
  const timeZone = process.env.REPORT_TIMEZONE || "Asia/Kolkata";
  const projectName = process.env.REPORT_PROJECT_NAME || "Shunyalabs Widget Automation";
  const dashboardUrl = process.env.REPORT_DASHBOARD_URL || "";
  const recipients = process.env.REPORT_RECIPIENTS || "";
  const emailUrl = process.env.EMAIL_WEB_APP_URL || "";

  const history = loadHistory();
  const todayKey = getDateKey(new Date(), timeZone);
  const todaysRuns = history.filter((run) =>
    getDateKey(new Date(run.startedAt), timeZone) === todayKey,
  );

  const summary = summarizeRuns(todaysRuns);
  const reportDate = formatDate(new Date(), timeZone);
  const subject = `QC Automation Report – ${reportDate}`;
  const body = buildEmailBody({
    projectName,
    summary,
    dashboardUrl,
    reportDate,
  });

  await sendEmail({
    url: emailUrl,
    to: recipients,
    subject,
    body,
  });
  console.log("Daily report email sent.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
