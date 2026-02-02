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

## Run tests

- `npm test` (runs tests + dashboard generation)
- `npm run test:ui`
- `npm run test:headed`
- `npm run test:report`

## Dashboard

After each `npm test`, a static dashboard is generated in:

```
dashboard/
```

Files of interest:

- `dashboard/index.html` (main dashboard)
- `dashboard/history/runs.json` (full run history, last 100)
- `dashboard/data/latest.json` (current run details)
- `dashboard/exports/current-run.csv` (current run CSV)

### Publish to GitHub Pages

1. Commit the `dashboard/` folder.
2. In GitHub → Settings → Pages:
   - Source: Deploy from a branch
   - Branch: `main` (or `master`) and folder `/dashboard`
3. Your dashboard will be available at:

```
https://<your-github-username>.github.io/Shunyalabs_widget/
```
