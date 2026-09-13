import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await command(page, 'startLevel1');
await waitForScene(page, 'level');

const steps = (n) => page.evaluate((k) => window.__GAME_DEBUG__.command('advanceSteps', k), n);
const shot = (p) => page.screenshot({ path: p });
const state = () => page.evaluate(() => {
  const r = window.__GAME_DEBUG__.getState().runtime;
  return { x: r.playerX, enemies: r.enemies.map((e) => `${e.kind}@${e.x},${e.y}:${e.state}`), step: r.stepIndex };
});

// Walk to wave 1 and stop before engaging.
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); });
await steps(370);
await page.evaluate(() => { window.__GAME_DEBUG__.input('releaseRight'); });
log(JSON.stringify(await state()));
await shot('test-results/anim-01-frameA.png');

await steps(10); // one idle-cycle frame later
await shot('test-results/anim-02-frameB.png');

// Advance until a telegraph fires (attack frame), watching enemy states.
let fired = false;
for (let i = 0; i < 30 && !fired; i++) {
  await steps(10);
  const st = await state();
  if (st.enemies.some((e) => e.includes('telegraph') || e.includes('fire'))) {
    fired = true;
  }
}
log(JSON.stringify(await state()));
await shot('test-results/anim-03-fire.png');

// Wave 2 (sentry + grenadier): teleport just before the trigger, walk in.
await command(page, 'startAtCheckpoint', { id: 'mid' });
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); });
await steps(20);
await page.evaluate(() => { window.__GAME_DEBUG__.input('releaseRight'); });
log(JSON.stringify(await state()));
await shot('test-results/anim-04-wave2A.png');
await steps(10);
await shot('test-results/anim-05-wave2B.png');

// Boss idle frames, 30 steps apart.
await command(page, 'startAtCheckpoint', { id: 'preboss' });
await page.evaluate(() => { window.__GAME_DEBUG__.input('holdRight'); window.__GAME_DEBUG__.command('advanceSteps', 280); window.__GAME_DEBUG__.input('releaseRight'); });
await shot('test-results/anim-06-bossA.png');
await steps(30);
await shot('test-results/anim-07-bossB.png');

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
