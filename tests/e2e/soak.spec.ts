import { expect, test } from '@playwright/test';

interface SoakRuntime {
  maxEnemiesSeen?: number;
  maxPlayerBulletsSeen?: number;
  maxEnemyBulletsSeen?: number;
  scene?: string;
}

async function rt(page: import('@playwright/test').Page): Promise<SoakRuntime> {
  const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
  return { scene: state?.scene ?? undefined, ...(state?.runtime ?? {}) } as SoakRuntime;
}

/**
 * J4/D4: an accelerated ten-minute soak. The debug `advanceSteps` command
 * fast-forwards the real fixed-step simulation (36,000 steps = 10 min at
 * 60 Hz) while the player pushes through the level; enemy and projectile
 * counts must stay within configured bounds with no uncaught errors.
 */
test.describe('M7 soak test (J4, D4)', () => {
  test.setTimeout(180_000);

  test('ten simulated minutes keep enemy and projectile counts bounded', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const heapBefore = await page.evaluate(() => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0);

    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    for (let chunk = 0; chunk < 10; chunk++) {
      // Fire occasionally to keep player projectiles cycling too.
      await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
      await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
      await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 3600));
    }
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));

    const heapAfter = await page.evaluate(() => (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0);
    const after = await rt(page);

    expect(after.maxEnemiesSeen ?? 0).toBeLessThanOrEqual(12);
    expect(after.maxPlayerBulletsSeen ?? 0).toBeLessThanOrEqual(96);
    expect(after.maxEnemyBulletsSeen ?? 0).toBeLessThanOrEqual(96);
    expect(pageErrors).toEqual([]);

    // The bridge stays responsive after the soak and can still advance steps.
    const resumed = await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 60));
    expect((resumed as { ok?: boolean } | undefined)?.ok).toBe(true);

    // Recorded for PROGRESS.md (memory trend, per TEST_PLAN section 7).
    console.log(
      'SOAK maxEnemies=' + after.maxEnemiesSeen +
      ' maxPlayerBullets=' + after.maxPlayerBulletsSeen +
      ' maxEnemyBullets=' + after.maxEnemyBulletsSeen +
      ' heapBefore=' + heapBefore +
      ' heapAfter=' + heapAfter
    );
  });
});
