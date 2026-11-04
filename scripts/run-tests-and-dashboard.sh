#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p reports/html reports/fragments docs/history docs/data docs/exports docs/playwright-artifacts test-results

run_project() {
  local project="$1"
  shift
  local fragment="reports/fragments/${project}.json"
  echo ""
  echo "========== Playwright project: ${project} =========="
  PLAYWRIGHT_REPORT_FRAGMENT="${fragment}" npx playwright test --project="${project}" "$@"
}

MERGE_INPUTS=()
TEST_EXIT=0
set +e

echo ""
echo "========== Playground auth (once) =========="
node -e "require('./tests/global-setup.js')().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); })" || TEST_EXIT=1
export PLAYWRIGHT_SKIP_GLOBAL_SETUP=1

run_project site || TEST_EXIT=1
MERGE_INPUTS+=(reports/fragments/site.json)

run_project playground --workers=1 || TEST_EXIT=1
MERGE_INPUTS+=(reports/fragments/playground.json)

run_project api || TEST_EXIT=1
MERGE_INPUTS+=(reports/fragments/api.json)

if [ "${RUN_HEALTH:-0}" = "1" ]; then
  run_project health || TEST_EXIT=1
  MERGE_INPUTS+=(reports/fragments/health.json)
fi

set -e

node scripts/merge-playwright-reports.js "${MERGE_INPUTS[@]}"

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
