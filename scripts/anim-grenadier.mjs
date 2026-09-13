import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await command(page, 'startLevel1');
await waitForScene(page, 'level');
const steps = (n) => page.evaluate((k) => window.__GAME_DEBUG__.command('advanceSteps', k), n);

// Wave 3 trigger at 1720-1760 spawns a grenadier at 1500... walk from mid.
await command(page, 'startAtCheckpoint', { id: 'mid' });
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); });
await steps(560);
await page.evaluate(() => { window.__GAME_DEBUG__.input('releaseRight'); });
await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const r = window.__GAME_DEBUG__.getState().runtime;
  // zoom 3x on the grenadier if one is alive
  const g = r.enemies.find((e) => e.kind === 'grenadier');
  if (g) {
    canvas.style.transformOrigin = `${g.x - r.playerX + 480}px 460px`;
    canvas.style.transform = 'scale(3)';
  }
});
await page.waitForTimeout(80);
await page.screenshot({ path: 'test-results/anim-11-grenadier.png' });
await page.evaluate(() => { document.querySelector('canvas').style.transform = ''; });

// telegraph frame
for (let i = 0; i < 20; i++) {
  await steps(15);
  const st = await page.evaluate(() => window.__GAME_DEBUG__.getState().runtime.enemies.map((e) => e.kind + ':' + e.state));
  if (st.some((e) => e.includes('telegraph'))) { break; }
}
await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  const r = window.__GAME_DEBUG__.getState().runtime;
  const g = r.enemies.find((e) => e.kind === 'grenadier');
  if (g) {
    canvas.style.transformOrigin = `${g.x - r.playerX + 480}px 460px`;
    canvas.style.transform = 'scale(3)';
  }
});
await page.waitForTimeout(80);
await page.screenshot({ path: 'test-results/anim-12-grenadier-fire.png' });
log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
