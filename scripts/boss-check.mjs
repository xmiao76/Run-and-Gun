import { chromium } from '@playwright/test';

// One-off: capture the Siege Walker boss fight for art review.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/shots/boss-fight.png' });

  // Vulnerable window: after the first attack cycle resolves.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 240));
  const vulnerable = await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossVulnerable);
  console.log('vulnerable:', vulnerable);
  await page.screenshot({ path: 'test-results/shots/boss-vulnerable.png' });

  // Zoom on the walker.
  await page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    const r = window.__GAME_DEBUG__?.getState()?.runtime;
    if (scene && r) {
      scene.cameras.main.setZoom(2);
      scene.cameras.main.centerOn((r.bossX ?? r.playerX + 200) - scene.cameraX, 400);
    }
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/shots/boss-zoom.png' });

  await browser.close();
}
void main();
