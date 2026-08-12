import { chromium } from '@playwright/test';

/** Empirical check: can the player walk through the Level 2 door on foot? */
const BASE = process.argv[2] ?? 'http://localhost:4173';
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto(`${BASE}/?debug=1&manualClock=1&renderer=canvas`);
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel2'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1640 }));
  // Hold right via the debug input bridge and step, logging position + door state.
  await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
  for (let i = 0; i < 30; i++) {
    const info = await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b.command('advanceSteps', 20);
      const scene = window.__GAME__?.scene.getScene('level');
      return {
        x: scene?.player?.x,
        doorOpen: scene?.doors?.[0]?.open,
        doorX: scene?.doors?.[0]?.rect?.x
      };
    });
    console.log(`step ${i * 20}: x=${info.x?.toFixed(1)} doorOpen=${info.doorOpen}`);
    if (info.x > 1830) { console.log('PASSED the door'); break; }
  }
  await browser.close();
}
void main();
