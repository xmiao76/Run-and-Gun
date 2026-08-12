import { defineConfig } from '@playwright/test';

/**
 * The suite normally runs against a locally built preview. Pointing
 * TEST_BASE_URL at a deployed site (e.g. https://run-and-gun.pages.dev via
 * `npm run test:e2e:live`) verifies production with the very same specs; the
 * local web server is skipped in that case.
 *
 * The env read goes through a typed globalThis cast because the project keeps
 * @types/node out of its dependencies; this config is the only Node-run TS file.
 */
const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const REMOTE_BASE = nodeEnv?.TEST_BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: REMOTE_BASE ?? 'http://localhost:4173',
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
      testMatch: /(smoke|keyboardAim|focusResume|extensionConflict|hud)\.spec\.ts/
    }
  ],
  webServer: REMOTE_BASE
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 120_000
      }
});
