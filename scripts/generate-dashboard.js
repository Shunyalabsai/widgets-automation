const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const REPORT_JSON = path.join(ROOT, "reports", "playwright-report.json");
const DASHBOARD_DIR = path.join(ROOT, "docs");
const HISTORY_DIR = path.join(DASHBOARD_DIR, "history");
const DATA_DIR = path.join(DASHBOARD_DIR, "data");
const EXPORTS_DIR = path.join(DASHBOARD_DIR, "exports");
const ARTIFACTS_DIR = path.join(DASHBOARD_DIR, "playwright-artifacts");
const TEST_RESULTS_DIR = path.join(ROOT, "test-results");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatDateTime(iso) {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatDateOnly(iso) {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return iso;
  }
}

function formatTimeOnly(iso) {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function normalizePath(filePath) {
  return filePath ? filePath.split(path.sep).join("/") : "";
}

function moduleFromFile(filePath) {
  const normalized = normalizePath(filePath);
  const match = normalized.match(/\/tests\/([^/]+)\//);
  if (match) return match[1];
  const directMatch = normalized.match(/^([^/]+)\//);
  if (directMatch) return directMatch[1];
  return "unknown";
}

function moduleLabel(moduleName) {
  if (moduleName.toLowerCase() === "stt") return "STT";
  return moduleName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function collectTestsFromSuite(suite, parentTitles = [], fileHint = "") {
  const tests = [];
  const titleParts = suite.title ? [...parentTitles, suite.title] : parentTitles;
  const filePath = suite.file || fileHint;

  for (const spec of suite.specs || []) {
    const specTitle = spec.title ? [...titleParts, spec.title].join(" > ") : titleParts.join(" > ");
    const specFile = spec.file || filePath;

    for (const test of spec.tests || []) {
      const testTitle = test.title ? [specTitle, test.title].filter(Boolean).join(" > ") : specTitle;
      const results = test.results || [];
      const lastResult = results[results.length - 1] || {};
      const status = lastResult.status || test.expectedStatus || "unknown";
      const durationMs = lastResult.duration || 0;
      const error = lastResult.error
        ? lastResult.error.message || lastResult.error.stack || JSON.stringify(lastResult.error)
        : "";

      tests.push({
        title: testTitle,
        status,
        durationMs,
        file: specFile,
        attachments: lastResult.attachments || [],
        error,
      });
    }
  }

  for (const childSuite of suite.suites || []) {
    tests.push(...collectTestsFromSuite(childSuite, titleParts, filePath));
  }

  return tests;
}

function summarizeTests(tests) {
  const summary = {
    total: tests.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
  };

  for (const test of tests) {
    if (test.status === "passed") summary.passed += 1;
    else if (test.status === "failed") summary.failed += 1;
    else if (test.status === "skipped") summary.skipped += 1;
    else if (test.status === "timedOut") summary.timedOut += 1;
    else summary.skipped += 1;
  }

  return summary;
}

function passRate(summary) {
  if (!summary.total) return 0;
  return Math.round((summary.passed / summary.total) * 100);
}

function summarizeByModule(tests) {
  const modules = {};
  for (const test of tests) {
    const moduleName = moduleFromFile(test.file);
    if (!modules[moduleName]) {
      modules[moduleName] = { total: 0, passed: 0, failed: 0, skipped: 0, timedOut: 0 };
    }
    modules[moduleName].total += 1;
    if (test.status === "passed") modules[moduleName].passed += 1;
    else if (test.status === "failed") modules[moduleName].failed += 1;
    else if (test.status === "skipped") modules[moduleName].skipped += 1;
    else if (test.status === "timedOut") modules[moduleName].timedOut += 1;
    else modules[moduleName].skipped += 1;
  }
  return modules;
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function writeCsv(filePath, headers, rows) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function copyArtifacts(attachments, runId) {
  const copied = [];
  const runDir = path.join(ARTIFACTS_DIR, runId);
  ensureDir(runDir);

  attachments.forEach((attachment, index) => {
    if (!attachment.path) return;
    const src = attachment.path;
    if (!fs.existsSync(src)) return;
    const ext = path.extname(src) || "";
    const baseName = `${attachment.name || "attachment"}-${index}${ext}`;
    const dest = path.join(runDir, baseName);
    fs.copyFileSync(src, dest);
    copied.push({
      name: attachment.name || "attachment",
      contentType: attachment.contentType,
      path: path.relative(DASHBOARD_DIR, dest).split(path.sep).join("/"),
    });
  });

  return copied;
}

function loadReportJson() {
  if (!fs.existsSync(REPORT_JSON)) {
    throw new Error("Playwright JSON report not found. Run tests first.");
  }
  return JSON.parse(fs.readFileSync(REPORT_JSON, "utf8"));
}

function buildRun() {
  const report = loadReportJson();
  const tests = [];
  for (const suite of report.suites || []) {
    tests.push(...collectTestsFromSuite(suite));
  }

  const runId = crypto.randomUUID();
  const startedAt = report.startTime || new Date().toISOString();
  const durationMs = report.duration || tests.reduce((sum, t) => sum + t.durationMs, 0);

  const enrichedTests = tests.map((test) => {
    const moduleName = moduleFromFile(test.file);
    const moduleDisplay = moduleLabel(moduleName);
    const attachments = copyArtifacts(test.attachments, runId);
    return {
      ...test,
      module: moduleName,
      moduleLabel: moduleDisplay,
      attachments,
    };
  });

  const summary = summarizeTests(enrichedTests);

  return {
    id: runId,
    startedAt,
    durationMs,
    summary,
    passRate: passRate(summary),
    displayTimestamp: formatDateTime(startedAt),
    displayDate: formatDateOnly(startedAt),
    displayTime: formatTimeOnly(startedAt),
    modules: summarizeByModule(enrichedTests),
    tests: enrichedTests,
  };
}

function loadHistory() {
  const historyPath = path.join(HISTORY_DIR, "runs.json");
  if (!fs.existsSync(historyPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(historyPath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveHistory(runs) {
  const historyPath = path.join(HISTORY_DIR, "runs.json");
  fs.writeFileSync(historyPath, JSON.stringify(runs, null, 2), "utf8");
}

function writeDashboardFiles(run, history) {
  const latestPath = path.join(DATA_DIR, "latest.json");
  const summaryPath = path.join(DATA_DIR, "latest-summary.json");
  fs.writeFileSync(latestPath, JSON.stringify(run, null, 2), "utf8");
  fs.writeFileSync(summaryPath, JSON.stringify(run.summary, null, 2), "utf8");

  const currentRows = run.tests.map((test) => ({
    id: run.id,
    module: test.moduleLabel,
    status: test.status,
    durationMs: test.durationMs,
    title: test.title,
    file: test.file,
    error: test.error,
  }));

  writeCsv(
    path.join(TEST_RESULTS_DIR, "current-run.csv"),
    ["id", "module", "status", "durationMs", "title", "file", "error"],
    currentRows,
  );
  writeCsv(
    path.join(EXPORTS_DIR, "current-run.csv"),
    ["id", "module", "status", "durationMs", "title", "file", "error"],
    currentRows,
  );

  const historyRows = history.map((historyRun) => ({
    id: historyRun.id,
    startedAt: historyRun.startedAt,
    durationMs: historyRun.durationMs,
    total: historyRun.summary.total,
    passed: historyRun.summary.passed,
    failed: historyRun.summary.failed,
    skipped: historyRun.summary.skipped,
  }));

  writeCsv(
    path.join(EXPORTS_DIR, "all-runs-summary.csv"),
    ["id", "startedAt", "durationMs", "total", "passed", "failed", "skipped"],
    historyRows,
  );
  writeCsv(
    path.join(TEST_RESULTS_DIR, "all-runs-summary.csv"),
    ["id", "startedAt", "durationMs", "total", "passed", "failed", "skipped"],
    historyRows,
  );
}

function ensureDashboardIndex() {
  const indexPath = path.join(DASHBOARD_DIR, "index.html");
  if (fs.existsSync(indexPath)) return;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Shunyalabs Widget Automation Dashboard</title>
    <style>
      body { font-family: Inter, system-ui, Arial, sans-serif; margin: 24px; color: #111; }
      h1 { margin-bottom: 8px; }
      .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
      .card { border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 16px; }
      .badge { padding: 2px 8px; border-radius: 999px; font-size: 12px; }
      .passed { background: #e7f7ed; color: #1f7a3c; }
      .failed { background: #feeceb; color: #b42318; }
      .skipped { background: #f2f4f7; color: #667085; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; font-size: 14px; }
      .filters button { margin-right: 8px; }
      .tests { margin-top: 24px; }
      .attachments a { margin-right: 8px; }
      .history { margin-top: 24px; }
      .history li { margin-bottom: 8px; }
      .muted { color: #666; }
      .small { font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Automation Dashboard</h1>
    <div class="meta">Shunyalabs widget automation reports</div>

    <div class="grid" id="summaryCards"></div>

    <div class="card">
      <h2>Module breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
          </tr>
        </thead>
        <tbody id="moduleRows"></tbody>
      </table>
    </div>

    <div class="card tests">
      <h2>Tests</h2>
      <div class="filters">
        <button data-filter="all">All</button>
        <button data-filter="passed">Passed</button>
        <button data-filter="failed">Failed</button>
        <button data-filter="skipped">Skipped</button>
      </div>
      <div id="testsList"></div>
    </div>

    <div class="card history">
      <h2>Run history</h2>
      <ul id="historyList"></ul>
      <div class="small muted">History retains the last 100 runs.</div>
    </div>

    <div class="card">
      <h2>Exports</h2>
      <ul>
        <li><a href="./exports/current-run.csv">Current run (CSV)</a></li>
        <li><a href="./exports/all-runs-summary.csv">All runs summary (CSV)</a></li>
        <li><a href="./history/runs.json">All runs full data (JSON)</a></li>
        <li><a href="./data/latest.json">Current run (JSON)</a></li>
      </ul>
    </div>

    <script>
      const statusBadge = (status) => {
        const cls = status === "passed" ? "passed" : status === "failed" ? "failed" : "skipped";
        return '<span class="badge ' + cls + '">' + status + '</span>';
      };

      const renderSummary = (run) => {
        const summary = run.summary;
        const cards = [
          { label: "Total", value: summary.total },
          { label: "Passed", value: summary.passed },
          { label: "Failed", value: summary.failed },
          { label: "Skipped", value: summary.skipped },
          { label: "Duration (ms)", value: run.durationMs },
        ];
        document.getElementById("summaryCards").innerHTML = cards
          .map((card) => '<div class="card"><div class="muted small">' + card.label + '</div><div>' + card.value + '</div></div>')
          .join("");
      };

      const renderModules = (modules) => {
        const rows = Object.entries(modules).map(([moduleName, stats]) => {
          return '<tr><td>' + moduleName + '</td><td>' + stats.total + '</td><td>' + stats.passed + '</td><td>' + stats.failed + '</td><td>' + stats.skipped + '</td></tr>';
        });
        document.getElementById("moduleRows").innerHTML = rows.join("");
      };

      const renderTests = (tests, filter) => {
        const filtered = filter === "all" ? tests : tests.filter((test) => test.status === filter);
        const items = filtered.map((test) => {
          const attachments = (test.attachments || []).map((attachment) => '<a href="./' + attachment.path + '">' + attachment.name + '</a>').join(" ");
          return '<div class="card"><div><strong>' + test.moduleLabel + '</strong> - ' + test.title + '</div>'
            + '<div class="small muted">' + test.file + '</div>'
            + '<div>Status: ' + statusBadge(test.status) + ' | ' + test.durationMs + ' ms</div>'
            + (test.error ? '<div class="small">Error: ' + test.error + '</div>' : '')
            + (attachments ? '<div class="attachments small">Artifacts: ' + attachments + '</div>' : '')
            + '</div>';
        });
        document.getElementById("testsList").innerHTML = items.join("");
      };

      const renderHistory = (runs) => {
        const items = runs.map((run) => {
          const passRate = run.summary.total ? Math.round((run.summary.passed / run.summary.total) * 100) : 0;
          return '<li><strong>' + run.startedAt + '</strong> - ' + run.summary.passed + '/' + run.summary.total + ' passed (' + passRate + '%)</li>';
        });
        document.getElementById("historyList").innerHTML = items.join("");
      };

      const attachFilters = (tests) => {
        document.querySelectorAll(".filters button").forEach((btn) => {
          btn.addEventListener("click", () => renderTests(tests, btn.dataset.filter));
        });
      };

      Promise.all([
        fetch("./data/latest.json").then((res) => res.json()),
        fetch("./history/runs.json").then((res) => res.json()),
      ]).then(([latest, history]) => {
        renderSummary(latest);
        renderModules(latest.modules);
        renderTests(latest.tests, "all");
        attachFilters(latest.tests);
        renderHistory(history);
      }).catch((error) => {
        document.body.innerHTML = '<h1>Dashboard data missing</h1><p>' + error + '</p>';
      });
    </script>
  </body>
</html>`;

  fs.writeFileSync(indexPath, html, "utf8");
  fs.writeFileSync(path.join(DASHBOARD_DIR, ".nojekyll"), "", "utf8");
}

function main() {
  ensureDir(HISTORY_DIR);
  ensureDir(DATA_DIR);
  ensureDir(EXPORTS_DIR);
  ensureDir(ARTIFACTS_DIR);
  ensureDir(TEST_RESULTS_DIR);

  const run = buildRun();
  const history = loadHistory();
  history.unshift(run);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const trimmedHistory = history.filter((r) => {
    const t = new Date(r.startedAt).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });

  saveHistory(trimmedHistory);
  writeDashboardFiles(run, trimmedHistory);
  ensureDashboardIndex();
}

main();
