import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await page.waitForTimeout(300);
await page.screenshot({ path: 'test-results/font-01-title.png' });

await page.keyboard.press('h');
await waitForScene(page, 'help');
await page.screenshot({ path: 'test-results/font-02-help.png' });

await page.keyboard.press('Escape');
await waitForScene(page, 'title');
await page.keyboard.press('s');
await waitForScene(page, 'settings');
await page.screenshot({ path: 'test-results/font-03-settings.png' });

await page.keyboard.press('Escape');
await waitForScene(page, 'title');
await command(page, 'startLevel1');
await waitForScene(page, 'level');
await command(page, 'advanceSteps', 120);
await page.screenshot({ path: 'test-results/font-04-hud.png' });

// Boss bar + name
await command(page, 'startAtCheckpoint', { id: 'preboss' });
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); window.__GAME_DEBUG__.command('advanceSteps', 200); window.__GAME_DEBUG__.input('releaseRight'); });
await page.waitForTimeout(200);
await page.screenshot({ path: 'test-results/font-05-bosshud.png' });

// Game over
await command(page, 'triggerGameOver');
await command(page, 'advanceSteps', 10);
await waitForScene(page, 'gameOver');
await page.screenshot({ path: 'test-results/font-06-gameover.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
