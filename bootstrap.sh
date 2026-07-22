#!/usr/bin/env sh
set -eu

command -v node >/dev/null 2>&1 || { echo "Node.js is required but was not found in PATH." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but was not found in PATH." >&2; exit 1; }

if [ ! -f package.json ]; then
  npm init -y
fi

npm install phaser
npm install --save-dev vite typescript vitest @vitest/coverage-v8 @playwright/test eslint @eslint/js typescript-eslint
npx playwright install chromium

mkdir -p \
  src/app \
  src/scenes \
  src/simulation \
  src/entities \
  src/levels \
  src/input \
  src/audio \
  src/persistence \
  src/ui \
  src/debug \
  src/balance \
  public/assets/images \
  public/assets/audio \
  tests/unit \
  tests/integration \
  tests/e2e

echo "Dependencies and directories are ready. Claude Code should create and verify the project configuration during M0."
