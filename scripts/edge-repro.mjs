import { chromium } from '@playwright/test';

/**
 * Repro: press each gameplay key in a given browser channel and report whether
 * the game reacted. Usage: node scripts/edge-repro.mjs [msedge|chrome] [url]
 */
const channel = process.argv[2] ?? 'msedge';
const BASE = process.argv[3] ?? 'https://run-and-gun.pages.dev';

async function main() {
  const browser = await chromium.launch({ channel });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });

  const rt = () => page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);

  await page.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title', null, { timeout: 20_000 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost', null, { timeout: 20_000 });
  console.log(`[${channel}] level loaded`);

  // What does the page actually observe for each key? Capture raw events too.
  await page.evaluate(() => {
    window.__SEEN = [];
    window.addEventListener('keydown', (e) => {
      window.__SEEN.push({ code: e.code, key: e.key, repeat: e.repeat, defaultPrevented: e.defaultPrevented });
    });
  });

  const before = await rt();
  console.log(`[${channel}] start x=${before.playerX} projectiles=${before.projectileCount}`);

  // Fire with X.
  await page.keyboard.down('x');
  await page.waitForTimeout(400);
  const afterFire = await rt();
  await page.keyboard.up('x');
  console.log(`[${channel}] after X: projectiles=${afterFire.projectileCount} angle=${afterFire.fireAngle}`);

  // Jump with Z.
  await page.keyboard.down('z');
  await page.waitForTimeout(250);
  const afterJump = await rt();
  await page.keyboard.up('z');
  console.log(`[${channel}] after Z: grounded=${afterJump.grounded}`);

  // Move with ArrowRight.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  const afterMove = await rt();
  await page.keyboard.up('ArrowRight');
  console.log(`[${channel}] after ArrowRight: x=${afterMove.playerX}`);

  const seen = await page.evaluate(() => window.__SEEN);
  console.log(`[${channel}] keydown events seen:`, JSON.stringify(seen));
  console.log(`[${channel}] errors:`, JSON.stringify(errors));

  const fireOk = (afterFire.projectileCount ?? 0) > 0;
  const jumpOk = afterJump.grounded === false;
  const moveOk = (afterMove.playerX ?? 0) > (before.playerX ?? 0);
  console.log(`[${channel}] RESULT fire=${fireOk ? 'OK' : 'FAIL'} jump=${jumpOk ? 'OK' : 'FAIL'} move=${moveOk ? 'OK' : 'FAIL'}`);

  await browser.close();
}
void main();
