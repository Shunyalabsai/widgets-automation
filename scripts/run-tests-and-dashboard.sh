#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p reports/html docs/history docs/data docs/exports docs/playwright-artifacts test-results

TEST_EXIT=0
set +e
npx playwright test
TEST_EXIT=$?
set -e

node scripts/generate-dashboard.js
node scripts/update-coverage-sheet.js || true

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add docs
  if ! git diff --cached --quiet; then
    COMMIT_MSG="Update dashboard $(date -u +'%Y-%m-%d %H:%M UTC')"
    git commit -m "$COMMIT_MSG"
    git push
  fi
fi

exit $TEST_EXIT
