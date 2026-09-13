import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await page.screenshot({ path: 'test-results/pal-01-title.png' });

await command(page, 'startLevel1');
await waitForScene(page, 'level');
await command(page, 'advanceSteps', 120);
await page.screenshot({ path: 'test-results/pal-02-l1-start.png' });

// Combat: fire the wave-1 enemies in
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); window.__GAME_DEBUG__.command('advanceSteps', 300); window.__GAME_DEBUG__.input('firePress'); window.__GAME_DEBUG__.command('advanceSteps', 30); window.__GAME_DEBUG__.input('fireRelease'); window.__GAME_DEBUG__.input('releaseRight'); });
await page.screenshot({ path: 'test-results/pal-03-l1-combat.png' });

// L1 boss
await command(page, 'startAtCheckpoint', { id: 'preboss' });
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); window.__GAME_DEBUG__.command('advanceSteps', 200); window.__GAME_DEBUG__.input('releaseRight'); });
await page.screenshot({ path: 'test-results/pal-04-l1-boss.png' });

// L2
await command(page, 'startLevel2');
await waitForScene(page, 'level');
await command(page, 'advanceSteps', 120);
await page.screenshot({ path: 'test-results/pal-05-l2-start.png' });

await command(page, 'startAtCheckpoint', { id: 'preboss' });
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); window.__GAME_DEBUG__.command('advanceSteps', 200); window.__GAME_DEBUG__.input('releaseRight'); });
await page.screenshot({ path: 'test-results/pal-06-l2-boss.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
