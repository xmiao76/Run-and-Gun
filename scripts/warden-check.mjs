import { chromium } from '@playwright/test';

// One-off: capture the Reactor Warden fight for art review.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel2'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/shots/warden-fight.png' });

  // Zoom on the warden.
  await page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    const r = window.__GAME_DEBUG__?.getState()?.runtime;
    if (scene && r) {
      scene.cameras.main.setZoom(2);
      scene.cameras.main.centerOn((r.playerX ?? 2600) + 220 - scene.cameraX, 400);
    }
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/shots/warden-zoom.png' });

  await browser.close();
}
void main();
