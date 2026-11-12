# Shunyalabs Widget Automation

Playwright-based automation tests for Shunyalabs widgets.

## Setup

1. Install dependencies:
   - `npm install`
2. Install Playwright browsers:
   - `npm run pw:install`

## Configure

Copy `.env.example` to `.env` and set Clerk credentials (`SHUNYA_TEST_EMAIL`, `SHUNYA_TEST_PASSWORD`).

For **daily contact-form email delivery** (reCAPTCHA bypass), add the secret Shunya shares out-of-band:

```
CONTACT_AUTOMATION_SECRET=...
```

The API test posts to `https://www.shunyalabs.ai/api/site/send-mail` with header `X-Automation-Secret` and email **`automated-test@example.com`** (must match exactly). The first successful run per 24h expects HTTP 200; a second run the same day expects HTTP 429 and is treated as pass. Public `/contact` UI tests do not submit the form (reCAPTCHA). In GitHub Actions, add repository secret **`CONTACT_AUTOMATION_SECRET`**.

For **Resonance** (homepage “Talk to Meera” demo call), every run checks the tab UI (phone field + button). The **real demo call** runs **once per day on the morning schedule only** via API (Cloudflare Turnstile blocks browser submit). Configure Apps Script: morning trigger → `triggerRunTestsMorning`; other triggers → `triggerRunTests`. GitHub secrets: **`RESONANCE_CALLBACK_PATH`** (from backend), **`RESONANCE_AUTOMATION_PHONE`** (test number), optional **`RESONANCE_AUTOMATION_SECRET`** (falls back to `CONTACT_AUTOMATION_SECRET`).

Set the widget URL in your shell before running tests:

```
export WIDGET_URL="https://your-app.example.com/widget"
```

The starter test looks for a widget root element with:

```
data-testid="shunyalabs-widget"
```

Update the selector in `tests/widgets.spec.ts` to match your widget.

## Test data

Place uploaded-audio test files in:

```
tests/data/stt/
```

Example file referenced by tests:

```
tests/data/stt/saira-mix.opus
```

Live-recording simulation uses:

```
tests/data/stt/live-recording.opus
tests/data/stt/live-recording-expected.json
```

CodeSwitch upload uses:

```
tests/data/codeswitch/saira-hignlish.opus
```

## Run tests

- `npm test` (runs tests + dashboard generation)
- `npm run test:ui`
- `npm run test:headed`
- `npm run test:report`

## Dashboard

After each `npm test`, a static dashboard is generated in:

```
docs/
```

Files of interest:

- `docs/index.html` (main dashboard)
- `docs/history/runs.json` (full run history, last 100)
- `docs/data/latest.json` (current run details)
- `docs/exports/current-run.csv` (current run CSV)

### Publish to GitHub Pages (GitHub Actions)

1. In GitHub → Settings → Pages:
   - Source: **GitHub Actions**
2. Push to `main`. The workflow publishes the `docs/` dashboard automatically.
3. Dashboard:

```
https://shunyalabsai.github.io/widgets-automation/
```

Repository: https://github.com/Shunyalabsai/widgets-automation

### Google Apps Script Scheduler (exact timing)

For exact-time runs without GitHub schedule drift, use Apps Script triggers:

- `docs/gas-scheduler-setup.md`
