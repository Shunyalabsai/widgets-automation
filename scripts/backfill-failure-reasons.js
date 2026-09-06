const fs = require("fs");
const path = require("path");
const {
  buildRunFailureSummary,
  enrichTestsWithFailureAnalysis,
} = require("./failure-reporting");

const ROOT = path.resolve(__dirname, "..");
const HISTORY_PATH = path.join(ROOT, "docs", "history", "runs.json");
const LATEST_PATH = path.join(ROOT, "docs", "data", "latest.json");

function backfillRun(run) {
  const tests = enrichTestsWithFailureAnalysis(run.tests || []);
  return {
    ...run,
    tests,
    failureSummary: buildRunFailureSummary(tests),
  };
}

function main() {
  if (!fs.existsSync(HISTORY_PATH)) {
    throw new Error(`History not found: ${HISTORY_PATH}`);
  }

  const history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
  if (!Array.isArray(history)) {
    throw new Error("runs.json must be an array");
  }

  const enriched = history.map(backfillRun);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(enriched, null, 2), "utf8");

  if (fs.existsSync(LATEST_PATH)) {
    const latest = JSON.parse(fs.readFileSync(LATEST_PATH, "utf8"));
    fs.writeFileSync(LATEST_PATH, JSON.stringify(backfillRun(latest), null, 2), "utf8");
  }

  const failedRuns = enriched.filter(
    (run) => (run.summary?.failed ?? 0) + (run.summary?.timedOut ?? 0) > 0,
  );
  console.log(`Backfilled ${enriched.length} runs (${failedRuns.length} with failures).`);
  failedRuns.slice(0, 5).forEach((run) => {
    const failure = run.failureSummary?.failures?.[0];
    if (!failure) return;
    console.log(`- ${run.startedAt}: ${failure.testName} → ${failure.reason}`);
  });
}

main();
