import { chromium } from '@playwright/test';

/**
 * One-off visual inspection: capture the title screen and the prototype room
 * (idle, then after walking right so the run cycle, pickup, and enemies show).
 */
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));

  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/title.png' });

  await page.keyboard.press('KeyP');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'sandbox');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/shots/room-idle.png' });

  // Walk right to show the run cycle, collect the pickup, and trigger enemies.
  await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
  await page.waitForTimeout(2600);
  await page.screenshot({ path: 'test-results/shots/room-run.png' });
  await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/shots/room-enemies.png' });

  // Crisp 3x zoom centered on the player to inspect sprite detail (the canvas
  // is image-rendering: pixelated via Phaser's pixelArt config).
  await page.evaluate(() => {
    const runtime = window.__GAME_DEBUG__?.getState()?.runtime;
    const canvas = document.querySelector('canvas');
    if (canvas && runtime) {
      canvas.style.transformOrigin = `${runtime.playerX}px ${runtime.playerY}px`;
      canvas.style.transform = 'scale(3)';
    }
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'test-results/shots/room-zoom.png' });

  // Reset zoom, then capture the Level 1 player poses.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.transform = '';
    }
  });
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/level-idle.png' });

  await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/shots/level-aim-up.png' });
  await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimUp'));

  await page.keyboard.down('s');
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/shots/level-crouch.png' });
  await page.keyboard.up('s');

  await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/shots/level-run.png' });
  await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));

  // Death pose during the death pause.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.dying === true);
  await page.screenshot({ path: 'test-results/shots/level-death.png' });

  await browser.close();
}

void main();
