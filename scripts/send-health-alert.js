const fs = require("fs");
const path = require("path");
const { parseHealthReport, sampleFailedHealthRun } = require("./health-report");

const ROOT = path.resolve(__dirname, "..");
const PREVIEW_DIR = path.join(ROOT, "docs", "previews");
const HEALTH_DATA_PATH = path.join(ROOT, "docs", "data", "latest-health.json");

function formatTime(iso, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function normalizeSiteUrl(url) {
  const value = (url || "https://www.shunyalabs.ai/").trim();
  return value.endsWith("/") ? value : `${value}/`;
}

function buildHealthCheckTableRows(run) {
  return run.checks
    .map((check) => {
      const isFail = check.status === "failed" || check.status === "timedOut";
      const statusColor = isFail ? "#dc2626" : "#16a34a";
      const statusLabel = isFail ? "FAILED" : "OK";
      const errorRow = check.error
        ? `<p style="margin:6px 0 0;font-size:12px;color:#991b1b;line-height:1.4;">${check.error.replace(/</g, "&lt;")}</p>`
        : `<span style="color:#6b7280;">Healthy response</span>`;
      const noteRow = check.note
        ? `<p style="margin:4px 0 0;font-size:11px;color:#6b7280;">${check.note}</p>`
        : "";
      return `
        <tr style="background:${isFail ? "#fef2f2" : "#ffffff"};">
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">
            <strong>${check.name}</strong>
            <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">${check.endpoint}</p>
            ${noteRow}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">
            <span style="color:${statusColor};font-weight:700;">${statusLabel}</span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">${errorRow}</td>
        </tr>`;
    })
    .join("");
}

function buildHealthAlertEmail({ run, timeZone, dashboardUrl }) {
  const failedChecks = run.checks.filter(
    (c) => c.status === "failed" || c.status === "timedOut",
  );
  const when = formatTime(run.startedAt, timeZone);
  const siteUrl = normalizeSiteUrl(run.siteUrl);
  const envLabel = run.environment === "prod" ? "Production" : run.environment;
  const rows = buildHealthCheckTableRows(run);
  const failedSummary = failedChecks.map((c) => c.name).join(", ");

  return `
    <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
          <tr><td align="center">
            <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px 32px;color:#fff;">
                  <p style="margin:0 0 6px;font-size:12px;opacity:0.9;">Shunyalabs Widget Automation</p>
                  <h1 style="margin:0 0 8px;font-size:22px;">${envLabel} API health check failed</h1>
                  <p style="margin:0;font-size:14px;opacity:0.95;">${when} · ${envLabel} · <a href="${siteUrl}" style="color:#fff;text-decoration:underline;">${siteUrl}</a></p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.5;">
                    Every 15 minutes we verify core widget APIs and assets return a successful response.
                    <strong>${run.failed}</strong> of <strong>${run.total}</strong> checks failed on this run.
                    ${failedSummary ? `<br><span style="color:#991b1b;">Affected: ${failedSummary}</span>` : ""}
                  </p>
                  <p style="margin:0 0 16px;font-size:12px;color:#6b7280;line-height:1.4;">
                    ${
                      run.pipelineFailure
                        ? "The monitoring job could not produce a full API table. Fix the automation pipeline first, then re-run health checks."
                        : "This is an availability smoke check only. Full regression failures (UI/API tests) are reported separately on the automation dashboard."
                    }
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px;">
                    <tr style="background:#f9fafb;">
                      <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:11px;">Check</th>
                      <th style="padding:10px 14px;text-align:center;color:#6b7280;font-size:11px;">Status</th>
                      <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:11px;">Result</th>
                    </tr>
                    ${rows}
                  </table>
                  ${
                    dashboardUrl
                      ? `<p style="margin:20px 0 0;text-align:center;"><a href="${dashboardUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Dashboard</a></p>`
                      : ""
                  }
                  <p style="margin:24px 0 0;font-size:11px;color:#9ca3af;text-align:center;">
                    Automated API health monitoring · Shunyalabs
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;
}

function buildHealthPassPreviewEmail({ run, timeZone, dashboardUrl }) {
  const when = formatTime(run.startedAt, timeZone);
  const siteUrl = normalizeSiteUrl(run.siteUrl);
  const envLabel = run.environment === "prod" ? "Production" : run.environment;
  const rows = buildHealthCheckTableRows(run);

  return `
    <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
          <tr><td align="center">
            <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#059669,#047857);padding:28px 32px;color:#fff;">
                  <p style="margin:0 0 6px;font-size:12px;opacity:0.9;">Shunyalabs Widget Automation</p>
                  <h1 style="margin:0 0 8px;font-size:22px;">${envLabel} API health check passed</h1>
                  <p style="margin:0;font-size:14px;opacity:0.95;">${when} · ${envLabel} · <a href="${siteUrl}" style="color:#fff;text-decoration:underline;">${siteUrl}</a></p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 12px;padding:12px 14px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;font-size:12px;color:#065f46;line-height:1.5;">
                    <strong>Preview only.</strong> When all checks pass, we do <strong>not</strong> send this email in production — CI stays green and results are saved to <code style="font-size:11px;">docs/data/latest-health.json</code>.
                  </p>
                  <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.5;">
                    All <strong>${run.total}</strong> core API and asset smoke checks completed successfully on this run.
                  </p>
                  <p style="margin:0 0 16px;font-size:12px;color:#6b7280;line-height:1.4;">
                    Runs every 15 minutes in GitHub Actions. Alerts are sent only when one or more checks fail.
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px;">
                    <tr style="background:#f9fafb;">
                      <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:11px;">Check</th>
                      <th style="padding:10px 14px;text-align:center;color:#6b7280;font-size:11px;">Status</th>
                      <th style="padding:10px 14px;text-align:left;color:#6b7280;font-size:11px;">Result</th>
                    </tr>
                    ${rows}
                  </table>
                  ${
                    dashboardUrl
                      ? `<p style="margin:20px 0 0;text-align:center;"><a href="${dashboardUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View regression dashboard</a></p>`
                      : ""
                  }
                  <p style="margin:24px 0 0;font-size:11px;color:#9ca3af;text-align:center;">
                    Automated API health monitoring · Shunyalabs
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>
  `;
}

function buildSubject(run, timeZone) {
  const when = formatTime(run.startedAt, timeZone);
  const envLabel = run.environment === "prod" ? "Production" : run.environment;
  return `Shunyalabs API health alert – ${envLabel} – ${run.failed} check(s) failed – ${when}`;
}

function assertMaySendHealthAlert(run) {
  if (run.healthy && !run.pipelineFailure) {
    throw new Error(
      "Refusing to send health alert: all checks passed. Alerts are sent only on failure.",
    );
  }
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
    throw new Error(`Health alert email failed: ${response.status} ${text}`);
  }
}

function savePreview(html, filename = "health-alert-email.html") {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  const outPath = path.join(PREVIEW_DIR, filename);
  fs.writeFileSync(outPath, html, "utf8");
  return outPath;
}

function loadLatestHealthRun() {
  if (!fs.existsSync(HEALTH_DATA_PATH)) {
    throw new Error(
      `No latest health data at ${HEALTH_DATA_PATH}. Run: npm run health:check`,
    );
  }
  const run = JSON.parse(fs.readFileSync(HEALTH_DATA_PATH, "utf8"));
  if (!run.healthy) {
    throw new Error(
      "Latest health run is not a pass. Fix failures or use: npm run health:alert-preview",
    );
  }
  return run;
}

async function main() {
  const args = process.argv.slice(2);
  const preview = args.includes("--preview");
  const previewPass = args.includes("--preview-pass");
  const sampleFailure = args.includes("--sample-failure");

  const timeZone = process.env.REPORT_TIMEZONE || "Asia/Kolkata";
  const dashboardUrl =
    process.env.REPORT_DASHBOARD_URL ||
    "https://shunyalabsai.github.io/widgets-automation";
  const recipient = process.env.REPORT_RECIPIENTS || "";
  const emailUrl = process.env.EMAIL_WEB_APP_URL || "";

  if (previewPass) {
    const run = loadLatestHealthRun();
    const body = buildHealthPassPreviewEmail({ run, timeZone, dashboardUrl });
    const outPath = savePreview(body, "health-pass-email.html");
    console.log(`Pass preview written: ${outPath}`);
    console.log(`Based on run at ${run.startedAt} (${run.passed}/${run.total} passed).`);
    console.log("Open this file in your browser. This layout is for review only — not emailed on pass.");
    return;
  }

  let run;
  if (sampleFailure) {
    run = sampleFailedHealthRun();
  } else if (process.env.HEALTH_RUN_JSON && fs.existsSync(process.env.HEALTH_RUN_JSON)) {
    run = JSON.parse(fs.readFileSync(process.env.HEALTH_RUN_JSON, "utf8"));
  } else {
    run = parseHealthReport();
    fs.mkdirSync(path.dirname(HEALTH_DATA_PATH), { recursive: true });
    fs.writeFileSync(HEALTH_DATA_PATH, JSON.stringify(run, null, 2), "utf8");
  }

  if (preview || previewPass || sampleFailure) {
    // Previews never send email (handled above for previewPass; failure preview below).
  } else if (run.healthy && !run.pipelineFailure) {
    console.log("API health OK — no alert email sent (failures only).");
    return;
  }

  const body = buildHealthAlertEmail({ run, timeZone, dashboardUrl });
  const subject = buildSubject(run, timeZone);

  if (preview) {
    const outPath = savePreview(body);
    console.log(`Preview written: ${outPath}`);
    console.log("Open this file in your browser to see how the failure alert will look.");
    return;
  }

  assertMaySendHealthAlert(run);
  await sendEmail({ url: emailUrl, to: recipient, subject, body });
  console.log(`Health alert sent to: ${recipient}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
