import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`${BASE}/?debug=1&renderer=canvas`);
await page.waitForFunction(() => !!window.__GAME_DEBUG__);
await page.evaluate(() => window.__GAME_DEBUG__.command('startLevel1'));
await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

await page.evaluate(() => window.__GAME_DEBUG__.input('holdRight'));
for (let chunk = 0; chunk < 10; chunk++) {
  await page.evaluate(() => window.__GAME_DEBUG__.input('firePress'));
  await page.evaluate(() => window.__GAME_DEBUG__.input('fireRelease'));
  const res = await page.evaluate(() => window.__GAME_DEBUG__.command('advanceSteps', 3600));
  const st = await page.evaluate(() => window.__GAME_DEBUG__.getState());
  const r = st.runtime ?? {};
  console.log(
    `chunk=${chunk} steps=${res?.steps} ended=${res?.ended ?? 'null'} scene=${st.scene}` +
      ` lives=${r.lives ?? '-'} x=${r.playerX ?? '-'} maxX=${r.maxPlayerX ?? '-'}` +
      ` deaths=${Array.isArray(r.deaths) ? r.deaths.length : '-'} maxEnemies=${r.maxEnemiesSeen ?? '-'}`
  );
  if (res?.ended) break;
}

const resumed = await page.evaluate(() => window.__GAME_DEBUG__.command('advanceSteps', 60));
const final = await page.evaluate(() => window.__GAME_DEBUG__.getState());
console.log('resumed=', JSON.stringify(resumed));
console.log('finalScene=', final.scene, 'runtimeKeys=', Object.keys(final.runtime ?? {}).slice(0, 8).join(','));
const deaths = final.runtime?.deaths;
if (Array.isArray(deaths)) {
  const byCause = {};
  for (const d of deaths) byCause[d.cause] = (byCause[d.cause] ?? 0) + 1;
  console.log('deathsByCause=', JSON.stringify(byCause), 'free=', deaths.filter((d) => !d.costLife).length);
}
console.log('pageErrors=', errors.length);
await browser.close();
