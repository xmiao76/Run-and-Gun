import { chromium } from '@playwright/test';

// One-off: capture Level 2's fortress theme at several x positions.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel2'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/l2-start.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 600 }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/l2-pit.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1650 }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/l2-door.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2400 }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/l2-arena.png' });

  await browser.close();
}
void main();
