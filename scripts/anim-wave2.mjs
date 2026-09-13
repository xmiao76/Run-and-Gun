import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await command(page, 'startLevel1');
await waitForScene(page, 'level');

const steps = (n) => page.evaluate((k) => window.__GAME_DEBUG__.command('advanceSteps', k), n);
const state = () => page.evaluate(() => {
  const r = window.__GAME_DEBUG__.getState().runtime;
  return { x: r.playerX, cam: r.playerX, enemies: r.enemies.map((e) => `${e.kind}@${e.x}:${e.state}`) };
});

// From the mid checkpoint (x=1180) walk LEFT back into the wave-2 trigger band.
await command(page, 'startAtCheckpoint', { id: 'mid' });
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdLeft'); });
await steps(160);
await page.evaluate(() => { window.__GAME_DEBUG__.input('releaseLeft'); });
log('after trigger: ' + JSON.stringify(await state()));
await page.screenshot({ path: 'test-results/anim-08-wave2A.png' });

await steps(10);
await page.screenshot({ path: 'test-results/anim-09-wave2B.png' });

// Let them telegraph
for (let i = 0; i < 20; i++) {
  await steps(15);
  const st = await state();
  if (st.enemies.some((e) => e.includes('telegraph'))) { break; }
}
log('telegraph: ' + JSON.stringify(await state()));
await page.screenshot({ path: 'test-results/anim-10-wave2fire.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
