#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${CRON_ENV_FILE:-$ROOT_DIR/.env.cron}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

git pull --rebase origin "${CRON_BRANCH:-saira-widgets}"

if [ "${CRON_INSTALL_DEPS:-false}" = "true" ]; then
  npm ci
fi

if [ "${CRON_INSTALL_BROWSERS:-false}" = "true" ]; then
  npx playwright install --with-deps
fi

npm test
