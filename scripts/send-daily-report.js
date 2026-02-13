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

function formatTime(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function buildEmailBody({
  projectName,
  summary,
  dashboardUrl,
  reportDate,
  timeZone,
}) {
  const totalTests = summary.totalPassed + summary.totalFailed;
  const passRate = totalTests > 0 ? Math.round((summary.totalPassed / totalTests) * 100) : 0;
  const passRateColor = passRate >= 90 ? "#27ae60" : passRate >= 70 ? "#e67e22" : "#e74c3c";
  const passRateIcon = passRate >= 90 ? "&#9989;" : "&#9888;&#65039;";
  const latestRun = formatTime(new Date(), timeZone);

  const moduleRows = Object.entries(summary.modules)
    .map(([name, stats]) => {
      const total = stats.passed + stats.failed;
      const rate = total > 0 ? Math.round((stats.passed / total) * 100) : 0;
      const icon = stats.failed > 0 ? "&#10060;" : "&#9989;";
      return `
        <tr>
          <td style="padding:10px 15px;border-bottom:1px solid #f0f0f0;font-size:14px;">${icon} ${name}</td>
          <td style="padding:10px 15px;border-bottom:1px solid #f0f0f0;text-align:center;color:#27ae60;font-weight:600;">${stats.passed}</td>
          <td style="padding:10px 15px;border-bottom:1px solid #f0f0f0;text-align:center;color:#e74c3c;font-weight:600;">${stats.failed}</td>
          <td style="padding:10px 15px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:600;">${rate}%</td>
        </tr>`;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:20px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:30px 35px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 2px;font-size:12px;color:rgba(255,255,255,0.8);">&#127919;</p>
                          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#ffffff;">QC Automation Report</h1>
                          <p style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,0.85);">${projectName}</p>
                          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7);">Latest Run: ${latestRun}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Summary Cards -->
                <tr>
                  <td style="padding:25px 20px 10px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="25%" align="center" style="padding:0 5px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:10px;border:1px solid #e9ecef;">
                            <tr><td style="padding:18px 10px 4px;text-align:center;font-size:10px;font-weight:700;color:#6b7280;letter-spacing:0.5px;">TOTAL TESTS</td></tr>
                            <tr><td style="padding:2px 10px 18px;text-align:center;font-size:28px;font-weight:800;color:#1f2937;">${totalTests}</td></tr>
                          </table>
                        </td>
                        <td width="25%" align="center" style="padding:0 5px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
                            <tr><td style="padding:18px 10px 4px;text-align:center;font-size:10px;font-weight:700;color:#16a34a;letter-spacing:0.5px;">PASSED</td></tr>
                            <tr><td style="padding:2px 10px 18px;text-align:center;font-size:28px;font-weight:800;color:#16a34a;">${summary.totalPassed}</td></tr>
                          </table>
                        </td>
                        <td width="25%" align="center" style="padding:0 5px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:10px;border:1px solid #fecaca;">
                            <tr><td style="padding:18px 10px 4px;text-align:center;font-size:10px;font-weight:700;color:#dc2626;letter-spacing:0.5px;">FAILED</td></tr>
                            <tr><td style="padding:2px 10px 18px;text-align:center;font-size:28px;font-weight:800;color:#dc2626;">${summary.totalFailed}</td></tr>
                          </table>
                        </td>
                        <td width="25%" align="center" style="padding:0 5px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border-radius:10px;border:1px solid #fde68a;">
                            <tr><td style="padding:18px 10px 4px;text-align:center;font-size:10px;font-weight:700;color:${passRateColor};letter-spacing:0.5px;">PASS RATE</td></tr>
                            <tr><td style="padding:2px 10px 18px;text-align:center;font-size:28px;font-weight:800;color:${passRateColor};">${passRateIcon} ${passRate}%</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Module Table -->
                <tr>
                  <td style="padding:20px 25px 5px;">
                    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#374151;">&#128203; Results by Module</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                      <tr style="background-color:#f9fafb;">
                        <th style="padding:10px 15px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Module</th>
                        <th style="padding:10px 15px;text-align:center;font-size:12px;font-weight:600;color:#16a34a;border-bottom:2px solid #e5e7eb;">Pass</th>
                        <th style="padding:10px 15px;text-align:center;font-size:12px;font-weight:600;color:#dc2626;border-bottom:2px solid #e5e7eb;">Fail</th>
                        <th style="padding:10px 15px;text-align:center;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Rate</th>
                      </tr>
                      ${moduleRows}
                    </table>
                  </td>
                </tr>

                <!-- Dashboard Button -->
                <tr>
                  <td align="center" style="padding:25px 25px 10px;">
                    <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;">&#128202; View Full Dashboard</a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 25px 25px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;">
                        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Thanks & Regards,</p>
                        <p style="margin:0 0 15px;font-size:14px;font-weight:600;color:#374151;">Saira Automation BOT &#129302;</p>
                        <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated report generated from the latest test run.</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
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
  const totalTests = summary.totalPassed + summary.totalFailed;
  const passRate = totalTests > 0 ? Math.round((summary.totalPassed / totalTests) * 100) : 0;
  const subject = `QC ${projectName} Report – ${reportDate} – ${passRate}% Pass Rate`;
  const body = buildEmailBody({
    projectName,
    summary,
    dashboardUrl,
    timeZone,
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
