import { chromium } from '@playwright/test';

/**
 * Level 2 autopilot diagnostic: start Level 2 with the AI pilot engaged and
 * fast-forward, logging progress so stalls (moving-platform pit, spike
 * hazard, door, Reactor Warden) are visible.
 * Usage: npm run preview (port 4173), then node scripts/autopilot2-probe.mjs
 */
const BASE = process.argv[2] ?? 'http://localhost:4173';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${BASE}/?debug=1&manualClock=1&renderer=canvas`);
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
  // Engage the AI toggle, then start Level 2 directly.
  await page.evaluate(() => {
    const b = window.__GAME_DEBUG__;
    b.command('advanceSteps', 1);
  });
  await page.keyboard.press('i'); // title: starts Level 1 with AI on
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  // Jump straight to Level 2 with the toggle still on.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel2'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');

  let lastLives = null;
  for (let i = 0; i < 300; i++) {
    const state = await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      if (!b) return null;
      b.command('advanceSteps', 30);
      return b.getState();
    });
    const r = state?.runtime ?? {};
    if (state.scene !== 'level') {
      console.log(`>>> scene=${state.scene} final=${r.final} score=${r.score}`);
      break;
    }
    const livesNote = r.lives !== lastLives ? `  <<< lives ${lastLives}->${r.lives}` : '';
    lastLives = r.lives;
    if (i % 2 === 0 || livesNote) {
      console.log(
        `t=${i * 30} x=${r.playerX} g=${r.grounded} pose=${r.playerPose} ` +
        `lives=${r.lives} boss=${r.bossActive ? `${r.bossState} hp${r.bossHealth} vuln${r.bossVulnerable}@${r.bossX} subs${r.subcomponentsAlive}` : 'off'} ` +
        `comp=${r.completing} enemies=${(r.enemies ?? []).map((e) => `${e.kind}@${Math.round(e.x)}`).join(',')}${livesNote}`
      );
    }
  }
  console.log('page errors:', JSON.stringify(errors));
  await browser.close();
}
void main();
