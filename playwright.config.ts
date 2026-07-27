import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    {
      // Real Microsoft Edge. The game is played in both browsers, and input
      // bugs have shown up as "works in Chrome, not in Edge", so the
      // input-critical specs run against Edge too. Scoped to those specs to
      // keep the suite fast; requires Edge installed (`npx playwright install msedge`).
      name: 'msedge',
      use: { browserName: 'chromium', channel: 'msedge' },
      testMatch: /(smoke|keyboardAim|focusResume|hud)\.spec\.ts/
    }
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
