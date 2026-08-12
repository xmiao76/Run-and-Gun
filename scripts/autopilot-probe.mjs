import { chromium } from '@playwright/test';

/**
 * Diagnostic probe for the AI pilot: drives the same flow as the e2e spec
 * against a local preview build and prints progress so stalls are visible.
 * Usage: npm run build && npm run preview (port 4173), then node scripts/autopilot-probe.mjs
 */
const BASE = process.argv[2] ?? 'http://localhost:4173';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${BASE}/?debug=1&manualClock=1&renderer=canvas`);
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
  await page.keyboard.press('i');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  let lastLives = null;
  for (let i = 0; i < 240; i++) {
    const state = await page.evaluate(() => {
      const bridge = window.__GAME_DEBUG__;
      if (!bridge) return null;
      bridge.command('advanceSteps', 30);
      return bridge.getState();
    });
    const r = state?.runtime ?? {};
    if (state.scene !== 'level') {
      console.log(`left level: scene=${state.scene}`);
      break;
    }
    const livesNote = r.lives !== lastLives ? `  <<< lives ${lastLives}->${r.lives}` : '';
    lastLives = r.lives;
    console.log(
      `t=${i * 30} x=${r.playerX} g=${r.grounded} pose=${r.playerPose} ` +
      `lives=${r.lives} boss=${r.bossActive ? `${r.bossState} hp${r.bossHealth} vuln${r.bossVulnerable}@${r.bossX}` : 'off'} ` +
      `completing=${r.completing} enemies=${(r.enemies ?? []).map((e) => `${e.kind}@${Math.round(e.x)}`).join(',')}${livesNote}`
    );
  }
  console.log('page errors:', JSON.stringify(errors));
  await browser.close();
}
void main();
