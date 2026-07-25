import { chromium } from '@playwright/test';

// One-off: capture the three weapons firing in Level 1 for art review.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  async function fireShot(name, prep) {
    if (prep) await prep();
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForTimeout(120);
    await page.screenshot({ path: `test-results/shots/${name}.png` });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    await page.waitForTimeout(700);
  }

  await fireShot('weapon-pulse');
  await fireShot('weapon-scatter', async () => {
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 360 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.weapon === 'scatter');
  });
  await fireShot('weapon-rapid', async () => {
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1700 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.weapon === 'rapid');
  });
  await fireShot('weapon-aim-diag', async () => {
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
  });

  await browser.close();
}
void main();
