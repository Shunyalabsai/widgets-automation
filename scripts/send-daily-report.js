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
    .map(([name, stats]) => `<li><strong>${name}</strong> – ${stats.passed} Passed</li>`)
    .join("");
  const failLines = Object.entries(summary.modules)
    .map(([name, stats]) => `<li><strong>${name}</strong> – ${stats.failed} Failed</li>`)
    .join("");

  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          h2 {
            color: #2c3e50;
            font-size: 18px;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          h3 {
            color: #34495e;
            font-size: 16px;
            margin-top: 15px;
            margin-bottom: 8px;
          }
          .stats {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .stats p {
            margin: 8px 0;
            font-size: 15px;
          }
          .stats strong {
            color: #2c3e50;
            font-weight: 600;
          }
          ul {
            list-style-type: none;
            padding-left: 0;
            margin: 10px 0;
          }
          ul li {
            padding: 5px 0 5px 20px;
            position: relative;
          }
          ul li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #3498db;
            font-weight: bold;
          }
          .link {
            margin: 20px 0;
          }
          .link a {
            color: #3498db;
            text-decoration: none;
            font-weight: 500;
          }
          .link a:hover {
            text-decoration: underline;
          }
          .footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <p>Hi Team,</p>

          <h2>Project: ${projectName}</h2>

          <div class="stats">
            <p><strong>Total Runs:</strong> ${summary.totalRuns}</p>
            <p><strong>Total Passed:</strong> ${summary.totalPassed}</p>
            <p><strong>Total Failed:</strong> ${summary.totalFailed}</p>
          </div>

          <h3>Module-wise Summary:</h3>

          <p><strong>Pass:</strong></p>
          <ul>
            ${passLines || "<li>None</li>"}
          </ul>

          <p><strong>Fail:</strong></p>
          <ul>
            ${failLines || "<li>None</li>"}
          </ul>

          <div class="link">
            <p><strong>For more details, follow the link:</strong></p>
            <p><a href="${dashboardUrl}" target="_blank">${dashboardUrl}</a></p>
          </div>

          <div class="footer">
            <p>Thanks & Regards,<br>
            <strong>Saira Automation BOT</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
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
  const subject = `QC Shunya Labs Widget Automation Report – ${reportDate}`;
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
