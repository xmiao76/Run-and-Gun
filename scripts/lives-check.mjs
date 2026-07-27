import { chromium } from '@playwright/test';

/** Capture the settings screen and the HUD at 3 vs 30 lives. */
const BASE = process.argv[2] ?? 'http://localhost:4173';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  const rt = () => page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);

  await page.goto(`${BASE}/?debug=1&renderer=canvas`);
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

  // HUD at the default 3 lives.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.waitForTimeout(400);
  console.log('default lives:', (await rt()).lives);
  await page.screenshot({ path: 'test-results/shots/lives-hud-3.png' });

  // Settings screen with the new row.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('gotoTitle'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
  await page.keyboard.press('s');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'settings');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/shots/lives-settings.png' });

  // Capture the HUD at every offered option, so the life row is checked at its
  // worst case (5 icons) as well as the collapsed high counts.
  for (const target of [5, 10, 30]) {
    await page.evaluate(() => window.__GAME_DEBUG__?.command('gotoTitle'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('s');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'settings');
    for (let i = 0; i < 8; i++) {
      if ((await rt())?.startingLives === target) break;
      await page.keyboard.press('l');
      await page.waitForTimeout(80);
    }
    if (target === 30) {
      await page.screenshot({ path: 'test-results/shots/lives-settings-30.png' });
    }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    await page.waitForTimeout(400);
    console.log(`option ${target} -> run lives:`, (await rt()).lives);
    await page.screenshot({ path: `test-results/shots/lives-hud-${target}.png` });
  }

  await browser.close();
}
void main();
