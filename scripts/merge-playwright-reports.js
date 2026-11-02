const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "reports", "playwright-report.json");

const inputs = process.argv.slice(2).filter(Boolean);
if (!inputs.length) {
  console.error("Usage: node scripts/merge-playwright-reports.js report1.json report2.json ...");
  process.exit(1);
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const reports = inputs.map((p) => loadJson(path.isAbsolute(p) ? p : path.join(ROOT, p))).filter(Boolean);
if (!reports.length) {
  console.error("No report files found to merge.");
  process.exit(1);
}

const merged = {
  ...reports[0],
  suites: [],
  errors: [],
};

let duration = 0;
for (const report of reports) {
  merged.suites.push(...(report.suites || []));
  merged.errors.push(...(report.errors || []));
  duration += report.duration || 0;
  if (report.startTime && (!merged.startTime || report.startTime < merged.startTime)) {
    merged.startTime = report.startTime;
  }
}
merged.duration = duration;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`Merged ${reports.length} reports → ${OUT} (${merged.suites.length} top-level suites)`);
