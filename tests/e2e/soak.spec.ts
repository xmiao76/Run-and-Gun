import { expect, test } from '@playwright/test';

interface SoakSample {
  maxEnemiesSeen?: number;
  maxPlayerBulletsSeen?: number;
  maxEnemyBulletsSeen?: number;
  stepIndex?: number;
}

interface ChunkResult {
  steps: number;
  ended: 'results' | 'gameOver' | null;
  runtime: SoakSample | null;
}

const CHUNK_STEPS = 3600;
const CHUNKS = 10;
const TOTAL_STEPS = CHUNK_STEPS * CHUNKS;

/**
 * J4/D4: an accelerated ten-minute soak. The debug `advanceSteps` command
 * fast-forwards the real fixed-step simulation (36,000 steps = 10 min at
 * 60 Hz) while the player pushes through the level; enemy and projectile
 * counts must stay within configured bounds with no uncaught errors.
 *
 * The counters are sampled inside the same page evaluate that runs the chunk.
 * That matters: a chunk can end the run, and once Phaser processes the queued
 * scene swap the published runtime is the game-over snapshot, which carries no
 * counters at all. Reading them afterwards silently compared `undefined ?? 0`
 * against the caps, so the bounds were asserted against 0 rather than against
 * anything the simulation produced.
 *
 * A run that ends is restarted and the soak continues, so the full ten minutes
 * are ten minutes of live simulation rather than of a stopped scene - and the
 * repeated restarts make this a stricter leak test than a single run was.
 */
test.describe('M7 soak test (J4, D4)', () => {
  test.setTimeout(180_000);

  // @slow-live: 36,000 bridge round-trips plus a Chrome-only heap assertion are
  // environment-sensitive over the CDN; live runs default to skipping it via
  // `--grep-invert @slow-live` (see scripts/test-live.mjs). Local runs keep it.
  test('ten simulated minutes keep enemy and projectile counts bounded @slow-live', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const heapBefore = await page.evaluate(
      () => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0
    );

    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));

    let maxEnemies = 0;
    let maxPlayerBullets = 0;
    let maxEnemyBullets = 0;
    let simulatedSteps = 0;
    let restarts = 0;

    // Loop on steps remaining, not on a chunk count: a chunk that ends the run
    // stops early and returns fewer steps than requested, and the soak still
    // owes the simulation that time.
    for (let guard = 0; simulatedSteps < TOTAL_STEPS && guard < CHUNKS * 20; guard++) {
      const request = Math.min(CHUNK_STEPS, TOTAL_STEPS - simulatedSteps);
      // One atomic evaluate: fire, advance, and read the counters before any
      // frame can run and swap the scene out from under the snapshot.
      const result = (await page.evaluate((n) => {
        const bridge = window.__GAME_DEBUG__;
        if (!bridge) {
          return { steps: 0, ended: null, runtime: null };
        }
        bridge.input('firePress');
        bridge.input('fireRelease');
        const res = bridge.command('advanceSteps', n) as { steps?: number; ended?: 'results' | 'gameOver' | null };
        return {
          steps: res?.steps ?? 0,
          ended: res?.ended ?? null,
          runtime: (bridge.getState().runtime ?? null) as SoakSample | null
        };
      }, request)) as ChunkResult;

      simulatedSteps += result.steps;
      maxEnemies = Math.max(maxEnemies, result.runtime?.maxEnemiesSeen ?? 0);
      maxPlayerBullets = Math.max(maxPlayerBullets, result.runtime?.maxPlayerBulletsSeen ?? 0);
      maxEnemyBullets = Math.max(maxEnemyBullets, result.runtime?.maxEnemyBulletsSeen ?? 0);

      if (result.ended !== null) {
        // The run ended mid-chunk (the pusher walks into the first pit until it
        // runs out of lives). Start a fresh level and keep soaking.
        restarts += 1;
        await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
        await page.waitForFunction(
          () => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost'
        );
        await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
      }
    }
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));

    const heapAfter = await page.evaluate(
      () => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0
    );

    // The counters must be real, not the `undefined ?? 0` the old spec asserted.
    expect(maxEnemies).toBeGreaterThan(0);
    expect(maxPlayerBullets).toBeGreaterThan(0);

    expect(maxEnemies).toBeLessThanOrEqual(12);
    expect(maxPlayerBullets).toBeLessThanOrEqual(96);
    expect(maxEnemyBullets).toBeLessThanOrEqual(96);
    expect(pageErrors).toEqual([]);

    // Ten simulated minutes really were simulated, not skipped by a dead scene.
    expect(simulatedSteps).toBe(TOTAL_STEPS);

    // The bridge stays responsive after the soak and can still advance steps.
    const resumed = await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 60));
    expect((resumed as { ok?: boolean } | undefined)?.ok).toBe(true);
    expect((resumed as { steps?: number } | undefined)?.steps).toBe(60);

    // Recorded for PROGRESS.md (memory trend, per TEST_PLAN section 7).
    console.log(
      'SOAK maxEnemies=' + maxEnemies +
      ' maxPlayerBullets=' + maxPlayerBullets +
      ' maxEnemyBullets=' + maxEnemyBullets +
      ' restarts=' + restarts +
      ' steps=' + simulatedSteps +
      ' heapBefore=' + heapBefore +
      ' heapAfter=' + heapAfter
    );
  });
});
