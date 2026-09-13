import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await command(page, 'startSandbox');
await waitForScene(page, 'sandbox');
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

await page.evaluate(() => {
  const b = window.__GAME_DEBUG__;
  b.input('holdRight');
  b.command('advanceSteps', 150);
  b.input('releaseRight');
});
await frame();
await page.screenshot({ path: 'test-results/setpiece-01-turret.png' });

// catch it telegraphing
await page.evaluate(() => {
  const b = window.__GAME_DEBUG__;
  for (let i = 0; i < 600; i++) {
    b.command('advanceSteps', 1);
    const t = (b.getState().runtime.enemies || []).find((e) => e.kind === 'turret');
    if (t && t.state === 'telegraph') return;
  }
});
await page.evaluate(() => {
  const c = document.querySelector('canvas');
  c.style.transformOrigin = '562px 470px';
  c.style.transform = 'scale(3)';
});
await frame();
await page.screenshot({ path: 'test-results/setpiece-02-turret-fire.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
