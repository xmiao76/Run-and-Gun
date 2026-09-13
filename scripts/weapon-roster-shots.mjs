import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, { base: 'http://localhost:4173', manualClock: true });
const { page } = s;
await waitForScene(page, 'title');
await command(page, 'startLevel1');
await waitForScene(page, 'level');

const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function shoot(weapon, waitSteps, path) {
  await command(page, 'startAtCheckpoint', { id: 'start', weapon });
  await page.evaluate(() => {
    const b = window.__GAME_DEBUG__;
    b.input('holdRight');
    b.command('advanceSteps', 370);
    b.input('releaseRight');
  });
  await page.evaluate((n) => {
    const b = window.__GAME_DEBUG__;
    b.input('firePress');
    b.command('advanceSteps', 1);
    b.input('fireRelease');
    b.command('advanceSteps', n);
  }, waitSteps);
  await frame();
  await page.screenshot({ path });
  const r = await page.evaluate(() => window.__GAME_DEBUG__.getState().runtime);
  log(`${weapon}: proj=${r.projectileCount} enemies=${r.enemies.length} kills=${JSON.stringify(r.killsByKind)}`);
}

// Laser mid-flight through the runner line.
await shoot('laser', 17, 'test-results/wep-01-laser.png');
// Flame part-way through its arc.
await shoot('flame', 14, 'test-results/wep-02-flame.png');
await shoot('flame', 26, 'test-results/wep-03-flame-late.png');

// The L capsule on its platform in Level 1.
await command(page, 'startAtCheckpoint', { id: 'mid' });
await page.evaluate(() => { window.__GAME_DEBUG__.command('teleportPlayer', { x: 1800 }); window.__GAME_DEBUG__.command('advanceSteps', 4); });
await frame();
await page.screenshot({ path: 'test-results/wep-04-capsule.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
