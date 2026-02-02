#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p reports/html dashboard/history dashboard/data dashboard/exports dashboard/playwright-artifacts test-results

TEST_EXIT=0
set +e
npx playwright test
TEST_EXIT=$?
set -e

node scripts/generate-dashboard.js
node scripts/update-coverage-sheet.js || true

exit $TEST_EXIT
