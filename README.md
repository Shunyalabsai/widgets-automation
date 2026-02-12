# Shunyalabs Widget Automation

Playwright-based automation tests for Shunyalabs widgets.

## Setup

1. Install dependencies:
   - `npm install`
2. Install Playwright browsers:
   - `npm run pw:install`

## Configure

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
2. Push to `saira-widgets`. The workflow publishes the `docs/` dashboard automatically.
3. Your dashboard will be available at:

```
https://<your-github-username>.github.io/Shunyalabs_widget/
```

### Google Apps Script Scheduler (exact timing)

For exact-time runs without GitHub schedule drift, use Apps Script triggers:

- `docs/gas-scheduler-setup.md`
