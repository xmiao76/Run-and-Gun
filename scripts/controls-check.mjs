import { chromium } from '@playwright/test';

// Verify the new PC layout with real key presses: arrows move/aim, Z jumps,
// X fires, and Up no longer causes a jump.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  const rt = () => page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);

  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  const startX = (await rt()).playerX;

  // ArrowRight moves.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(350);
  const moved = (await rt()).playerX;
  await page.keyboard.up('ArrowRight');
  console.log('ArrowRight moved:', moved > startX, `(${startX} -> ${moved})`);

  // ArrowUp must NOT jump (the old bug).
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(300);
  const upState = await rt();
  console.log('ArrowUp grounded (should stay true):', upState.grounded, '| pose:', upState.playerPose);
  await page.keyboard.up('ArrowUp');

  // Z jumps.
  await page.keyboard.down('z');
  await page.waitForTimeout(200);
  const jumped = await rt();
  console.log('Z jumped (grounded false):', jumped.grounded === false, '| pose:', jumped.playerPose);
  await page.keyboard.up('z');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === true);

  // X fires straight ahead.
  await page.keyboard.down('x');
  await page.waitForTimeout(200);
  const fired = await rt();
  console.log('X fired:', (fired.projectileCount ?? 0) >= 1, '| angle:', fired.fireAngle);
  await page.keyboard.up('x');
  await page.waitForTimeout(300);

  // Up + Right + X = 45-degree diagonal.
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(120);
  await page.keyboard.down('x');
  await page.waitForTimeout(250);
  const diag = await rt();
  console.log('Up+Right+X diagonal angle (expect -45):', diag.fireAngle, '| pose:', diag.playerPose);
  await page.screenshot({ path: 'test-results/shots/controls-diagonal.png' });
  await page.keyboard.up('x');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');

  // Straight up: Up alone + X.
  await page.waitForTimeout(300);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(120);
  await page.keyboard.down('x');
  await page.waitForTimeout(250);
  console.log('Up+X angle (expect -90):', (await rt()).fireAngle);
  await page.keyboard.up('x');
  await page.keyboard.up('ArrowUp');

  console.log('pageErrors:', JSON.stringify(errors));
  await browser.close();
}
void main();
