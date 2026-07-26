import { chromium } from '@playwright/test';

// One-off: capture the new HUD in level 1 and the boss fight HUD.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/hud-level.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/hud-boss.png' });

  await browser.close();
}
void main();
