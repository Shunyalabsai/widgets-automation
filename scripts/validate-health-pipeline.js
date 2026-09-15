const fs = require("fs");
const path = require("path");
const { parseHealthReport, EXPECTED_HEALTH_CHECK_COUNT } = require("./health-report");

const ROOT = path.resolve(__dirname, "..");
const reportPath = path.join(ROOT, "reports", "health-playwright-report.json");

function main() {
  if (!fs.existsSync(reportPath)) {
    console.error(`Missing ${reportPath}. Run: npm run health:check`);
    process.exit(1);
  }
  const run = parseHealthReport(reportPath);
  if (run.total !== EXPECTED_HEALTH_CHECK_COUNT) {
    console.error(`Expected ${EXPECTED_HEALTH_CHECK_COUNT} checks, got ${run.total}`);
    process.exit(1);
  }
  const unnamed = run.checks.filter((c) => c.endpoint === "—");
  if (unnamed.length) {
    console.error("Some checks are missing labels/endpoints:", unnamed.map((c) => c.name));
    process.exit(1);
  }
  console.log(`Health report OK: ${run.passed}/${run.total} passed, labels mapped.`);
}

main();
