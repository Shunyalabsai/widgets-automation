#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p reports/html docs/history docs/data docs/exports docs/playwright-artifacts test-results

run_project() {
  local project="$1"
  shift
  echo ""
  echo "========== Playwright project: ${project} =========="
  npx playwright test --project="${project}" "$@"
}

TEST_EXIT=0
set +e
run_project health || TEST_EXIT=1
run_project api || TEST_EXIT=1
run_project ui --workers=1 || TEST_EXIT=1
set -e

if [ "$TEST_EXIT" -ne 0 ]; then
  echo "Test run failed (see project sections above)."
fi

node scripts/generate-dashboard.js
node scripts/update-coverage-sheet.js || true

if [ -z "${CI:-}" ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add docs
  if ! git diff --cached --quiet; then
    COMMIT_MSG="Update dashboard $(date -u +'%Y-%m-%d %H:%M UTC')"
    git commit -m "$COMMIT_MSG"
    git push
  fi
fi

exit $TEST_EXIT
