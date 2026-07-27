import { chromium } from '@playwright/test';

/**
 * Verify the arcade-feel pass: wider scatter fan, screen shake firing, denser
 * waves, and that the retuned physics still let the player traverse Level 1.
 */
const BASE = process.argv[2] ?? 'http://localhost:4173';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const rt = () => page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);
  const step = (n) => page.evaluate((k) => window.__GAME_DEBUG__?.command('advanceSteps', k), n);

  await page.goto(`${BASE}/?debug=1&renderer=canvas`);
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  // --- Denser waves: how many enemies does wave 1 field? ---
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
  await step(30);
  console.log('wave 1 enemy count:', (await rt()).enemyCount, '(was 2 before this pass)');

  // --- Screen shake actually runs on a player death ---
  const shakeApi = await page.evaluate(() => {
    const cam = window.__GAME__?.scene.getScene('level')?.cameras?.main;
    return { hasShake: typeof cam?.shake === 'function', hasEffect: cam?.shakeEffect !== undefined };
  });
  console.log('camera shake api:', JSON.stringify(shakeApi));

  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
  await page.waitForTimeout(120);
  const shaking = await page.evaluate(() => {
    const cam = window.__GAME__?.scene.getScene('level')?.cameras?.main;
    return cam?.shakeEffect?.isRunning ?? null;
  });
  console.log('shake running after player death:', shaking);

  // --- Reduced flash suppresses it ---
  await page.evaluate(() => window.__GAME_DEBUG__?.command('gotoTitle'));
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('operation-iron-echo:settings:v1');
    const s = raw ? JSON.parse(raw) : { version: 1 };
    s.reducedFlash = true;
    window.localStorage.setItem('operation-iron-echo:settings:v1', JSON.stringify(s));
  });
  await page.reload();
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
  await page.waitForTimeout(120);
  const shakingReduced = await page.evaluate(() => {
    const cam = window.__GAME__?.scene.getScene('level')?.cameras?.main;
    return cam?.shakeEffect?.isRunning ?? null;
  });
  console.log('shake running with reducedFlash=true:', shakingReduced, shakingReduced === false ? 'OK (suppressed)' : 'CHECK');

  // Restore the setting for the remaining checks.
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('operation-iron-echo:settings:v1');
    const s = raw ? JSON.parse(raw) : { version: 1 };
    s.reducedFlash = false;
    window.localStorage.setItem('operation-iron-echo:settings:v1', JSON.stringify(s));
  });
  await page.reload();
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

  // --- Wider scatter fan: capture the pellet spread ---
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 360 }));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.weapon === 'scatter');
  await page.keyboard.down('x');
  // Real frames, not advanceSteps: that command drives the simulation without a
  // render pass, so the sprite pool would not have synced yet.
  await page.waitForTimeout(120);
  const spread = await page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    return scene.children.list
      .map((c) => c)
      .filter((o) => o.type === 'Image' && o.visible && (o.texture?.key ?? '') === 'art/bullet-scatter')
      .map((o) => Math.round((o.rotation * 180) / Math.PI));
  });
  await page.keyboard.up('x');
  console.log('scatter pellet angles (deg):', JSON.stringify(spread), '(fan was +/-12, now +/-24)');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/shots/feel-scatter-fan.png' });

  // --- The retuned jump must still clear the first pit (720-840) ---
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  const livesBefore = (await rt()).lives;
  await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 660 }));
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => (window.__GAME_DEBUG__?.getState()?.runtime?.playerX ?? 0) >= 700, null, {
    timeout: 5000
  });
  await page.keyboard.down('z'); // jump at the pit edge
  await page.waitForTimeout(420);
  await page.keyboard.up('z');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  const end = await rt();
  const crossed = end.playerX > 840 && end.lives === livesBefore;
  console.log(`pit crossing: x=${end.playerX} lives=${end.lives}/${livesBefore} -> ${crossed ? 'OK' : 'FAIL'}`);
  await page.screenshot({ path: 'test-results/shots/feel-pit-crossing.png' });

  console.log('pageErrors:', JSON.stringify(errors));
  await browser.close();
}
void main();
