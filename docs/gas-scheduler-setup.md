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

- `GITHUB_OWNER`: `saira-uwc`
- `GITHUB_REPO`: `Shunyalabs_widget`
- `GITHUB_PAT`: `<your PAT>`

### 4) Add time triggers

Apps Script → Triggers → Add:

- `triggerRunTests` at **09:00**, **12:00**, **15:00** (IST)
- `triggerSendEmail` at **18:00** (IST)

### 5) Test

Run `triggerRunTests` manually once to verify.

### 6) Secrets in GitHub

Repo → Settings → Secrets → Actions:

- `GOOGLE_SHEETS_WEB_APP_URL`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `EMAIL_WEB_APP_URL`
- `REPORT_RECIPIENTS`

This keeps your scheduler free and on time.
