import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * Run the Playwright suite against the deployed site (or any URL).
 *
 * The suite's specs are target-agnostic: they navigate relative to Playwright's
 * baseURL and drive the game through the `?debug` bridge, which ships in the
 * production bundle. Setting TEST_BASE_URL points the same specs at
 * production, and playwright.config.ts skips the local web server.
 *
 * Usage:
 *   npm run test:e2e:live                              # full suite vs prod
 *   npm run test:e2e:live -- --grep-invert @slow-live  # skip CDN-sensitive soak
 *   node scripts/test-live.mjs http://localhost:4173 --project=chromium
 */
const args = process.argv.slice(2);
// An explicit base URL may lead; anything else is Playwright arguments.
const base = args[0]?.startsWith('http') ? args.shift() : 'https://run-and-gun.pages.dev';

console.log(`test:e2e:live -> ${base}`);
// Spawn the Playwright CLI through node directly: no shell and no npx shim,
// which sidesteps Windows .cmd resolution and Node's DEP0190 shell warning.
const require = createRequire(import.meta.url);
const playwrightCli = join(dirname(require.resolve('@playwright/test')), 'cli.js');
const result = spawnSync(process.execPath, [playwrightCli, 'test', ...args], {
  stdio: 'inherit',
  env: { ...process.env, TEST_BASE_URL: base }
});
process.exitCode = result.status ?? 1;
