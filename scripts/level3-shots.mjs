import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await command(page, 'startLevel3');
await waitForScene(page, 'level');
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const steps = (n) => page.evaluate((k) => window.__GAME_DEBUG__.command('advanceSteps', k), n);

await steps(60);
await frame();
await page.screenshot({ path: 'test-results/l3-01-start.png' });

// Walk to the first causeway and stand on it.
await page.evaluate(() => {
  const b = window.__GAME_DEBUG__;
  b.input('holdRight');
  for (let i = 0; i < 400; i++) {
    b.command('advanceSteps', 1);
    if (b.getState().runtime.playerX > 660) break;
  }
  b.input('releaseRight');
});
await steps(20);
await frame();
await page.screenshot({ path: 'test-results/l3-02-causeway.png' });
const st = await page.evaluate(() => window.__GAME_DEBUG__.getState().runtime);
log('on causeway: x=' + Math.round(st.playerX) + ' bridges=' + JSON.stringify(st.bridges));

// Let it collapse.
await steps(120);
await frame();
await page.screenshot({ path: 'test-results/l3-03-collapsed.png' });
const st2 = await page.evaluate(() => window.__GAME_DEBUG__.getState().runtime);
log('after: x=' + Math.round(st2.playerX) + ' lives=' + st2.lives + ' bridges=' + JSON.stringify(st2.bridges));

// Mid-level firefight.
await command(page, 'startAtCheckpoint', { id: 'mid' });
await page.evaluate(() => {
  const b = window.__GAME_DEBUG__;
  b.input('holdRight'); b.command('advanceSteps', 120); b.input('releaseRight');
});
await frame();
await page.screenshot({ path: 'test-results/l3-04-mid.png' });

await command(page, 'startAtCheckpoint', { id: 'preboss' });
await page.evaluate(() => {
  const b = window.__GAME_DEBUG__;
  b.input('holdRight'); b.command('advanceSteps', 300); b.input('releaseRight');
});
await frame();
await page.screenshot({ path: 'test-results/l3-05-boss.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
