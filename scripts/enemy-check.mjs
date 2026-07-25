import { chromium } from '@playwright/test';

// One-off: capture all four enemy sprites in Level 1 for art review.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  // Wave 1: runner + drone.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
  await page.waitForFunction(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime;
    return (r?.enemyCount ?? 0) >= 2;
  }, null, { timeout: 8000 });
  console.log('wave1 spawned');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/shots/enemies-wave1.png' });

  // Wave 2 in a fresh run so the player isn't exposed to the wave-1 crossfire.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('gotoTitle'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 800 }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1030 }));
  await page.waitForFunction(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime;
    return (r?.enemyCount ?? 0) >= 2;
  }, null, { timeout: 8000 });
  console.log('wave2 spawned');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/shots/enemies-wave2.png' });

  // Zoom on the wave-2 pair via camera zoom centered on the sentry.
  await page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    const r = window.__GAME_DEBUG__?.getState()?.runtime;
    const sentry = (r?.enemies ?? []).find((e) => e.kind === 'sentry');
    if (scene && sentry) {
      scene.cameras.main.setZoom(2);
      scene.cameras.main.centerOn(sentry.x - scene.cameraX, sentry.y);
    }
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'test-results/shots/enemies-zoom.png' });

  await browser.close();
}
void main();
