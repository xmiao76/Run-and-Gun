import { chromium } from '@playwright/test';

// One-off: capture Level 1's themed environment at several x positions.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/l1-start.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/shots/l1-wave1.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1800 }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/l1-mid.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2500 }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/l1-arena.png' });

  await browser.close();
}
void main();
