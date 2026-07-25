import { chromium } from '@playwright/test';

// Debug probe: what happens after teleporting into the wave-2 trigger region?
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
  await page.waitForFunction(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime;
    return (r?.enemyCount ?? 0) >= 2;
  });
  console.log('after wave1:', JSON.stringify(await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime)));

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1030 }));
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);
    console.log(`t=${(i + 1) * 400}ms count=${r?.enemyCount} lives=${r?.lives} x=${r?.playerX} dying=${r?.dying} enemies=${JSON.stringify(r?.enemies)}`);
  }
  await browser.close();
}
void main();
