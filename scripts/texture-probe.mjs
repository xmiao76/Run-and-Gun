import { chromium } from '@playwright/test';

// Probe the live boss texture size in the browser.
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  const dims = await page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    const img = scene.textures.get('art/boss-siege-walker').getSourceImage();
    return { w: img.width, h: img.height };
  });
  console.log('live texture size:', JSON.stringify(dims));
  await browser.close();
}
void main();
