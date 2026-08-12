import { chromium } from '@playwright/test';

/**
 * Full-run autopilot diagnostic: start at the title with the AI toggle on and
 * let it play hands-free through Level 1 -> results (auto-advance) -> Level 2
 * -> MISSION COMPLETE, logging scene transitions and progress.
 * Usage: npm run preview (port 4173), then node scripts/autopilot-fullrun.mjs
 */
const BASE = process.argv[2] ?? 'http://localhost:4173';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${BASE}/?debug=1&manualClock=1&renderer=canvas`);
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
  await page.keyboard.press('i'); // AI on, start Level 1
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  let lastScene = 'level';
  let lastLives = null;
  const start = Date.now();
  for (let i = 0; i < 600; i++) {
    const state = await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      if (!b) return null;
      b.command('advanceSteps', 30);
      return b.getState();
    });
    if (!state) break;
    const r = state.runtime ?? {};
    const sceneChanged = state.scene !== lastScene;
    if (sceneChanged) {
      console.log(`>>> [${((Date.now() - start) / 1000).toFixed(1)}s] scene: ${lastScene} -> ${state.scene} level=${r.level} final=${r.final} lives=${r.lives} score=${r.score}`);
      lastScene = state.scene;
    }
    if (r.lives !== lastLives && state.scene === 'level') {
      console.log(`  lives ${lastLives}->${r.lives} at x=${r.playerX} level=${r.level}`);
      lastLives = r.lives;
    }
    if (state.scene === 'title' && i > 5) {
      console.log('>>> back at title');
      break;
    }
    // Results auto-advance is 2 s of REAL time (no sim on that scene); wait for it.
    if (state.scene === 'results') {
      await page.waitForTimeout(2500);
    }
  }
  console.log('page errors:', JSON.stringify(errors));
  await browser.close();
}
void main();
