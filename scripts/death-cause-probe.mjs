/**
 * Death-cause probe: runs the AI pilot through a level under the manual clock
 * and reports the published death log grouped by cause.
 *
 * Evidence for the TASK-020 instrumentation: `pit` and `hazard` are covered by
 * deterministic e2e cases, while `enemyFire` and `bossShockwave` are the ones a
 * real run produces, so this shows them actually occurring in play.
 *
 *   node scripts/death-cause-probe.mjs [baseUrl] [level]
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const LEVEL = process.argv[3] ?? '1';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`${BASE}/?debug=1&renderer=canvas&manualClock=1&autopilot=1`);
await page.waitForFunction(() => !!window.__GAME_DEBUG__);
if (LEVEL === '2') {
  await page.evaluate(() => window.__GAME_DEBUG__.command('startLevel2'));
}
await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'level');

let total = 0;
for (let i = 0; i < 60; i++) {
  const res = await page.evaluate(() => {
    const b = window.__GAME_DEBUG__;
    const r = b.command('advanceSteps', 600);
    return { r, runtime: b.getState().runtime };
  });
  total += res.r?.steps ?? 0;
  const rt = res.runtime ?? {};
  if (res.r?.ended) {
    console.log(`ended=${res.r.ended} afterSteps=${total} maxX=${rt.maxPlayerX} lives=${rt.lives}`);
    report(rt.deaths ?? []);
    break;
  }
  if (i === 59) {
    console.log(`budget reached afterSteps=${total} maxX=${rt.maxPlayerX} lives=${rt.lives}`);
    report(rt.deaths ?? []);
  }
}

function report(deaths) {
  const byCause = {};
  for (const d of deaths) {
    byCause[d.cause] = (byCause[d.cause] ?? 0) + 1;
  }
  console.log('deaths=' + deaths.length, 'byCause=' + JSON.stringify(byCause));
  console.log('free (no life cost)=' + deaths.filter((d) => !d.costLife).length);
  for (const d of deaths) {
    console.log(`  step=${d.stepIndex} cause=${d.cause} x=${d.x} costLife=${d.costLife}`);
  }
}

console.log('pageErrors=' + errors.length);
await browser.close();
