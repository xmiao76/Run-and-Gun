/**
 * Can a grounded, passive player be killed by the Siege Walker stomp?
 *
 * The shockwave is the fourth death cause and the only one no deterministic
 * test covers yet, because the AI pilot jumps every stomp telegraph. This
 * stands still at a range of distances from the boss and reports what killed it.
 *
 *   node scripts/shockwave-probe.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

for (const standX of [2700, 2760, 2820, 2880, 2940]) {
  await page.goto(`${BASE}/?debug=1&renderer=canvas&manualClock=1`);
  await page.waitForFunction(() => !!window.__GAME_DEBUG__);
  await page.evaluate(() => window.__GAME_DEBUG__.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.evaluate(() => window.__GAME_DEBUG__.command('startAtCheckpoint', { id: 'preboss', lives: 30 }));

  // Walk into the arena so the boss activates honestly, then stand still.
  await page.evaluate(() => window.__GAME_DEBUG__.input('holdRight'));
  await page.evaluate(() => window.__GAME_DEBUG__.command('advanceSteps', 200));
  await page.evaluate(() => window.__GAME_DEBUG__.input('releaseRight'));
  await page.evaluate((x) => window.__GAME_DEBUG__.command('teleportPlayer', { x }), standX);

  const res = await page.evaluate(() => {
    const b = window.__GAME_DEBUG__;
    b.command('advanceSteps', 3000);
    return b.getState().runtime;
  });
  const deaths = res?.deaths ?? [];
  const byCause = {};
  for (const d of deaths) byCause[d.cause] = (byCause[d.cause] ?? 0) + 1;
  console.log(
    `standX=${standX} bossActive=${res?.bossActive} deaths=${deaths.length} byCause=${JSON.stringify(byCause)}`
  );
}

await browser.close();
