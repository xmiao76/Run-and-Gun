import { chromium } from '@playwright/test';

/**
 * Post-deploy smoke test against the live Cloudflare Pages site.
 * Verifies a plain visitor load (no debug params) and then a debug-enabled
 * load that starts a level and fires, to prove the deployed build is playable.
 */
const BASE = process.argv[2] ?? 'https://run-and-gun.pages.dev';

/**
 * Cache policy is what makes a fix take effect without a hard reload, so it is
 * asserted rather than assumed: the entry point must revalidate every load, and
 * the content-hashed bundle must be cacheable long-term.
 */
async function checkCacheHeaders() {
  let problems = 0;
  const htmlRes = await fetch(`${BASE}/`, { cache: 'no-store' });
  const htmlCc = htmlRes.headers.get('cache-control') ?? '';
  const revalidates = /no-cache|no-store|max-age=0/.test(htmlCc) || /must-revalidate/.test(htmlCc);
  console.log('index.html Cache-Control:', htmlCc, revalidates ? 'OK (revalidates)' : 'FAIL (may serve stale)');
  if (!revalidates) problems++;

  const html = await htmlRes.text();
  const assetPath = html.match(/assets\/[^"']+\.js/)?.[0];
  if (!assetPath) {
    console.log('bundle reference: FAIL (not found in index.html)');
    return problems + 1;
  }
  const assetRes = await fetch(`${BASE}/${assetPath}`, { cache: 'no-store' });
  const assetCc = assetRes.headers.get('cache-control') ?? '';
  const immutable = /immutable/.test(assetCc) || /max-age=[1-9]/.test(assetCc);
  console.log(`${assetPath} Cache-Control:`, assetCc, immutable ? 'OK (cacheable)' : 'WARN (revalidated every load)');
  if (!immutable) problems++;
  return problems;
}

async function main() {
  const browser = await chromium.launch();
  let failures = 0;

  failures += await checkCacheHeaders();

  // 1. Plain visitor load: canvas renders, no console/page errors.
  const plain = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const plainErrors = [];
  plain.on('pageerror', (e) => plainErrors.push(String(e)));
  plain.on('console', (m) => {
    if (m.type() === 'error') plainErrors.push('console: ' + m.text());
  });
  await plain.goto(BASE, { waitUntil: 'networkidle' });
  await plain.waitForSelector('canvas', { timeout: 20_000 });
  await plain.waitForTimeout(1500);
  const title = await plain.title();
  const canvasBox = await plain.locator('canvas').boundingBox();
  console.log('plain load: title =', JSON.stringify(title));
  console.log('plain load: canvas =', canvasBox ? `${Math.round(canvasBox.width)}x${Math.round(canvasBox.height)}` : 'MISSING');
  console.log('plain load: errors =', JSON.stringify(plainErrors));
  if (!canvasBox) failures++;
  if (plainErrors.length) failures++;
  await plain.screenshot({ path: 'test-results/shots/live-title.png' });
  await plain.close();

  // 2. Debug load: start level 1, move, fire, reach the boss.
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const rt = () => page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);

  await page.goto(`${BASE}/?debug=1&renderer=canvas`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title', null, { timeout: 20_000 });
  console.log('debug load: reached title scene');

  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost', null, { timeout: 20_000 });
  console.log('start: level 1 loaded');

  // Real keys: new bindings must work on the deployed build.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  const moved = (await rt()).playerX;
  console.log('ArrowRight moved to x =', moved, moved > 60 ? 'OK' : 'FAIL');
  if (!(moved > 60)) failures++;

  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('x');
  await page.waitForTimeout(250);
  const aimed = await rt();
  console.log('Up+X angle =', aimed.fireAngle, aimed.fireAngle === -90 ? 'OK' : 'FAIL');
  if (aimed.fireAngle !== -90) failures++;
  await page.keyboard.up('x');
  await page.keyboard.up('ArrowUp');
  await page.screenshot({ path: 'test-results/shots/live-gameplay.png' });

  // Boss reachable on the live build.
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true, null, { timeout: 20_000 });
  console.log('boss: Siege Walker activated');
  await page.screenshot({ path: 'test-results/shots/live-boss.png' });

  console.log('debug load: errors =', JSON.stringify(errors));
  if (errors.length) failures++;

  await browser.close();
  console.log(failures === 0 ? '\nLIVE CHECK PASSED' : `\nLIVE CHECK FAILED (${failures} problem(s))`);
  process.exitCode = failures === 0 ? 0 : 1;
}
void main();
