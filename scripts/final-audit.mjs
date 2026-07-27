import { chromium } from '@playwright/test';

// Final release audit: capture every user-facing screen.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/shots/final-title.png' });

  await page.keyboard.press('KeyH');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/final-help.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Prototype room via P.
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/shots/final-room.png' });

  // Level 1 gameplay.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/final-l1.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/shots/final-l1-combat.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/final-l1-boss.png' });

  // Level 2 gameplay + boss.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel2'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/final-l2.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/final-l2-boss.png' });

  // Game over.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('triggerGameOver'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/final-gameover.png' });

  // Restart with R and complete the level for the results screen.
  await page.keyboard.press('KeyR');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('completeLevel'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'results', null, { timeout: 10_000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/shots/final-results.png' });

  console.log('pageErrors:', JSON.stringify(errors));
  await browser.close();
}
void main();
