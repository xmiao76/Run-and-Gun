$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is required but was not found in PATH."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is required but was not found in PATH."
}

if (-not (Test-Path "package.json")) {
  npm init -y
}

npm install phaser
npm install --save-dev vite typescript vitest "@vitest/coverage-v8" "@playwright/test" eslint "@eslint/js" typescript-eslint
npx playwright install chromium

$directories = @(
  "src",
  "src/app",
  "src/scenes",
  "src/simulation",
  "src/entities",
  "src/levels",
  "src/input",
  "src/audio",
  "src/persistence",
  "src/ui",
  "src/debug",
  "src/balance",
  "public/assets/images",
  "public/assets/audio",
  "tests/unit",
  "tests/integration",
  "tests/e2e"
)

foreach ($directory in $directories) {
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

Write-Host "Dependencies and directories are ready. Claude Code should create and verify the project configuration during M0."
