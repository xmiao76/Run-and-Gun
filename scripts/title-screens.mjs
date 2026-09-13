import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173' });
const { page } = s;
await waitForScene(page, 'title');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/title-01-idle.png' });

// The attract demo running (forced on with the test seam)
await page.goto('http://localhost:4173/?debug=1&manualClock=1&attractMs=400');
await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'level', undefined, { timeout: 10_000 });
await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 300));
await page.screenshot({ path: 'test-results/title-02-demo.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
