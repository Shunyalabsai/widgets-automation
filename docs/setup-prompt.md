# Reusable Prompt for Setting Up Test Automation with Dashboard, Google Sheets & Email Reports

Copy the prompt below and paste it into Claude Code (or any AI assistant) in your new project directory.

---

## PROMPT

```
I want to set up a complete Playwright test automation framework for my project with the following features. Set up everything step by step, asking me for project-specific details as needed.

## 1. Playwright Test Suite

- Initialize Playwright with TypeScript config
- Use **only Chromium** browser
- Configure: 120s test timeout, 5s expect timeout, 1 retry
- Enable **fullyParallel** with **3 workers on CI**, auto locally
- Reporters: list (console), HTML (reports/html), JSON (reports/playwright-report.json)
- Screenshots only on failure, video retain on failure, trace off
- Create a **Page Object Model** pattern under `tests/pages/` with a base page class for navigation
- Organize tests by module under `tests/<module-name>/`
- Store test data (audio files, expected outputs, fixtures) under `tests/data/<module-name>/`

## 2. Dashboard Generation (`scripts/generate-dashboard.js`)

After every test run, automatically generate a dashboard:

- Parse `reports/playwright-report.json`
- Generate a unique run ID (UUID) for each run
- Extract all test results: title, status (passed/failed/skipped/timedOut), duration, file path, error messages, attachments
- Group tests by module (derive module from the test file's parent folder name)
- Calculate summary: total, passed, failed, skipped, timedOut, pass rate
- Copy test artifacts (screenshots, videos) to `docs/playwright-artifacts/{runId}/`
- Maintain a **rolling history of the last 100 runs** in `docs/history/runs.json`
- Save current run details to `docs/data/latest.json` and summary to `docs/data/latest-summary.json`
- Generate CSV exports: `docs/exports/current-run.csv` and `docs/exports/all-runs-summary.csv`
- Output a self-contained `docs/index.html` dashboard (single HTML file with embedded CSS/JS) that:
  - Fetches `data/latest.json` and `history/runs.json` client-side
  - Shows summary cards: Total Tests, Passed, Failed, Pass Rate
  - Shows current run status (pie chart), pass rate trend (line chart over last 12 runs), module pass rate (bar chart)
  - Lists test results by module with pass/fail counts, expandable to individual tests
  - Has tabs: Current Run, Run History, Calendar View
  - Has Export All dropdown (CSV current run, CSV all runs, JSON latest) and Print button
  - Shows "Last Run" timestamp in header
  - Is responsive, dark-themed, and works without any build step

## 3. Google Sheets Integration

### Node.js side (`scripts/update-coverage-sheet.js`):
- Read `docs/data/latest.json`
- Assign testcase IDs (TC001, TC002, ...) alphabetically by test title
- Build attachment URLs using `DASHBOARD_BASE_URL` env var
- Categorize attachments into buckets: screenshot, video, trace, other
- Format timestamps in IST (Asia/Kolkata) using `toLocaleString("en-IN", {timeZone: "Asia/Kolkata", ...})`
- POST JSON payload to `GOOGLE_SHEETS_WEB_APP_URL`

### Google Apps Script side (`scripts/google-sheets-webapp.gs`):
- `doPost(e)` handler that receives the payload
- Opens spreadsheet by ID (from payload or script properties)
- Gets or creates target sheet by name
- Ensures headers: ["Testcase ID", "Test Name", "Description", "Update Date & time", "Status", "Comment(proof)"]
- **Upserts rows** by Testcase ID (update existing or append new)
- Maps status: passed→PASS, failed→FAIL, timedout→TIMEOUT, skipped→SKIPPED
- Supports `clearSheet: true` to reset sheet before update
- Returns `{ok: true, rows: N}` or `{ok: false, error: "..."}`

## 4. Email Reporting

### Node.js side (`scripts/send-daily-report.js`):
- Load `docs/history/runs.json`
- Filter runs for today (using configurable timezone, default Asia/Kolkata)
- Summarize: count total runs, total passed/failed per module across all today's runs
- Build a styled HTML email with:
  - Project name, date
  - Total runs, total passed, total failed
  - Module-wise breakdown (pass/fail lists)
  - Link to dashboard
  - Signature: "Thanks & Regards, [Project] Automation BOT"
- POST `{to, subject, body}` to `EMAIL_WEB_APP_URL`

### Google Apps Script side (`scripts/google-email-webapp.gs`):
- `doPost(e)` handler
- Parse `{to, subject, body}` from JSON payload
- Send email using `MailApp.sendEmail({to, subject, htmlBody: body})`
- Return `{ok: true}` or `{ok: false, error: "..."}`

## 5. Test Runner Script (`scripts/run-tests-and-dashboard.sh`)

Bash script that orchestrates everything:
```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Create output directories
mkdir -p reports/html docs/history docs/data docs/exports docs/playwright-artifacts test-results

# Run tests (capture exit code, don't fail yet)
TEST_EXIT=0
set +e
npx playwright test
TEST_EXIT=$?
set -e

# Generate dashboard (always, even if tests fail)
node scripts/generate-dashboard.js

# Update Google Sheet (optional, don't fail if it errors)
node scripts/update-coverage-sheet.js || true

# Local only: commit and push docs
if [ -z "${CI:-}" ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add docs
  if ! git diff --cached --quiet; then
    git commit -m "Update dashboard $(date -u +'%Y-%m-%d %H:%M UTC')"
    git push
  fi
fi

exit $TEST_EXIT
```

## 6. GitHub Actions CI/CD (`.github/workflows/scheduled-tests.yml`)

Create a workflow with:

**Triggers**: `workflow_dispatch` + `repository_dispatch` (types: `run-tests`, `send-email`)

**Permissions**: contents write, pages write, id-token write

**Concurrency**: `group: "scheduled-pages"`, cancel-in-progress: false

**Jobs**:

### Job 1: `run-tests` (skip if event is `send-email`)
- Checkout code
- Setup Node 20
- `npm ci`
- Cache Playwright browsers (`~/.cache/ms-playwright`, key by `package-lock.json`)
- Install only chromium (skip download on cache hit, but always install system deps)
- Run `npm test` (capture exit code)
- Commit `docs/` changes with `github-actions` user
- Upload Pages artifact from `docs/`
- Fail job if tests failed

### Job 2: `deploy` (needs run-tests)
- Deploy to GitHub Pages using `actions/deploy-pages@v4`

### Job 3: `send-daily-email` (only on `send-email` event)
- Checkout + Setup Node
- Run `node scripts/send-daily-report.js`

**Required GitHub Secrets**:
- `GOOGLE_SHEETS_WEB_APP_URL`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `EMAIL_WEB_APP_URL`
- `REPORT_RECIPIENTS`

**Environment variables in workflow**:
- `GOOGLE_SHEETS_SHEET_NAME: test-coverage`
- `DASHBOARD_BASE_URL: https://shunyalabsai.github.io/widgets-automation`
- `REPORT_PROJECT_NAME: Shunyalabs Widget Automation`
- `REPORT_DASHBOARD_URL: https://shunyalabsai.github.io/widgets-automation`
- `REPORT_TIMEZONE: Asia/Kolkata`

## 7. Google Apps Script Scheduler (`scripts/google-scheduler.gs`)

A script deployed in Google Apps Script that triggers GitHub Actions at exact times:

```javascript
function dispatchWorkflow(eventType) {
  var props = PropertiesService.getScriptProperties();
  var owner = props.getProperty("GITHUB_OWNER");
  var repo = props.getProperty("GITHUB_REPO");
  var pat = props.getProperty("GITHUB_PAT");
  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/dispatches";
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "token " + pat, Accept: "application/vnd.github.v3+json" },
    payload: JSON.stringify({ event_type: eventType }),
    muteHttpExceptions: true,
  });
}
function triggerRunTests() { dispatchWorkflow("run-tests"); }
function triggerSendEmail() { dispatchWorkflow("send-email"); }
```

Set up time-driven triggers:
- `triggerRunTests` at 9:00 AM, 12:00 PM, 3:00 PM IST
- `triggerSendEmail` at 6:00 PM IST

Script properties needed: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PAT`

## 8. Package.json Scripts

```json
{
  "scripts": {
    "test": "bash scripts/run-tests-and-dashboard.sh",
    "test:raw": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:report": "playwright show-report",
    "dashboard:generate": "node scripts/generate-dashboard.js",
    "pw:install": "playwright install"
  }
}
```

## 9. .gitignore

```
node_modules/
playwright-report/
test-results/
.env
.DS_Store
```

## Important Notes

- All timestamps displayed to users should be in IST (Asia/Kolkata)
- The dashboard must be a single self-contained HTML file (no build step, no external CDN)
- Use Chart.js loaded from CDN for charts in the dashboard
- Google Sheets webapp uses upsert pattern (update by testcase ID, not append duplicates)
- History is capped at 100 runs to keep file size manageable
- The system should gracefully handle failures: if sheet update fails, tests still pass; if email fails, tests still pass
- Each test opens its own browser page, enabling safe parallel execution
- Dashboard gets committed to git and deployed to GitHub Pages automatically

Now, ask me for my project-specific details:
1. What is the project name?
2. What is the website/app URL to test?
3. What modules/features need testing and what tests for each?
4. What is the GitHub repository (owner/repo)?
5. What email recipients should receive daily reports?
```

---

## Setup Checklist (after running the prompt)

### Google Cloud Setup
1. [ ] Create a Google Sheet for test coverage tracking
2. [ ] Create Google Apps Script project for Sheets webapp → deploy as web app
3. [ ] Create Google Apps Script project for Email webapp → deploy as web app
4. [ ] Create Google Apps Script project for Scheduler → set script properties → add time triggers
5. [ ] Create GitHub Personal Access Token (PAT) with `repo` scope for the scheduler

### GitHub Setup
1. [ ] Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
2. [ ] Add secrets: `GOOGLE_SHEETS_WEB_APP_URL`, `GOOGLE_SHEETS_SPREADSHEET_ID`, `EMAIL_WEB_APP_URL`, `REPORT_RECIPIENTS`
3. [ ] Trigger first test run: Actions → Scheduled Widget Tests → Run workflow

### Verify
1. [ ] Tests pass in GitHub Actions
2. [ ] Dashboard updates at `https://<user>.github.io/<repo>/`
3. [ ] Google Sheet updates with test results
4. [ ] Email received at scheduled time
