## Google Apps Script Scheduler (Exact Timing)

This scheduler triggers GitHub Actions at exact times without cron drift.

### 1) Create a GitHub PAT

- Scope: `repo`
- Save it for the Apps Script

### 2) Create Apps Script project

- Open https://script.google.com
- New project
- Paste the code from `scripts/google-scheduler.gs`

### 3) Set Script Properties

In Apps Script → Project Settings → Script properties:

- `GITHUB_OWNER`: `Shunyalabsai`
- `GITHUB_REPO`: `widgets-automation`
- `GITHUB_PAT`: `<your PAT>`

### 4) Add time triggers

Apps Script → Triggers → Add:

- **`triggerRunTestsMorning`** at your **morning** slot (e.g. **09:00 IST**) — full regression + Resonance demo-call E2E (once per day)
- **`triggerRunTests`** for **afternoon / extra** runs — same tests **without** initiating the daily Resonance call

Example: morning **09:00** → `triggerRunTestsMorning`; afternoon **17:00** → `triggerRunTests`

Failure reports are sent automatically by GitHub Actions when a test run fails or times out. Do **not** add a separate email trigger.

### 5) Test

Run `triggerRunTests` manually once to verify.

### 6) Secrets in GitHub

Repo → Settings → Secrets → Actions:

- `GOOGLE_SHEETS_WEB_APP_URL`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `EMAIL_WEB_APP_URL`
- `REPORT_RECIPIENTS`

This keeps your scheduler free and on time.
