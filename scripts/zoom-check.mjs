import { chromium } from '@playwright/test';

// One-off: 3x zoomed captures of the Level 1 player poses for art review.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.waitForTimeout(300);

  async function zoomShot(name, setup) {
    await page.evaluate(() => {
      const scene = window.__GAME__?.scene.getScene('level');
      if (scene) scene.cameras.main.setZoom(1);
    });
    if (setup) await setup();
    await page.evaluate(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      const scene = window.__GAME__?.scene.getScene('level');
      const camX = scene ? scene.cameraX : 0;
      if (scene && r) {
        scene.cameras.main.setZoom(3);
        scene.cameras.main.centerOn(r.playerX - camX, r.playerY - 16);
      }
    });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `test-results/shots/${name}.png` });
  }

  await zoomShot('zoom-idle');
  await zoomShot('zoom-aim-up', async () => {
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
    await page.waitForTimeout(250);
  });
  await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimUp'));
  await zoomShot('zoom-crouch', async () => {
    await page.keyboard.down('s');
    await page.waitForTimeout(250);
  });
  await page.keyboard.up('s');
  await zoomShot('zoom-death', async () => {
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.dying === true);
  });

  await browser.close();
}
void main();
