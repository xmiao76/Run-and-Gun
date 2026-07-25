import { chromium } from '@playwright/test';

// Probe: which textures are on the level display list?
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('http://localhost:4173/?debug=1&renderer=canvas');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  const info = await page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    if (!scene) return { error: 'no scene' };
    const counts = {};
    for (const c of scene.children.list) {
      const o = c;
      const key = (o.texture && o.texture.key) || o.type;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
}
void main();
