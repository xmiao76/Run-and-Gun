import { expect, test } from '@playwright/test';

interface AnimRuntime {
  playerPose?: string;
  dying?: boolean;
  crouching?: boolean;
  grounded?: boolean;
  lives?: number;
}

function runtime(page: import('@playwright/test').Page): Promise<AnimRuntime | null> {
  return page.evaluate(() => (window.__GAME_DEBUG__?.getState()?.runtime ?? null) as AnimRuntime | null);
}

/**
 * Player animation states (TASK-002): the sprite must visibly transition
 * through idle, run, jump, crouch, aim-up, aim-diagonal, and the death/respawn
 * flow, driven by real input where possible.
 */
test.describe('player animation states', () => {
  test('pose follows movement, crouch, aim, and the death flow', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Idle at spawn.
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.playerPose === 'idle');

    // Run cycle while moving.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForFunction(() => {
      const p = window.__GAME_DEBUG__?.getState()?.runtime?.playerPose;
      return p === 'run-a' || p === 'run-b';
    });

    // Jump while airborne (still holding right).
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpPress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      return r?.playerPose === 'jump' && r?.grounded === false;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpRelease'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === true);

    // Crouch via the real keyboard (S maps to crouch/drop), on known solid ground.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 200 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.playerPose === 'idle');
    await page.keyboard.down('s');
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      return r?.crouching === true && r?.playerPose === 'crouch';
    });
    await page.keyboard.up('s');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.playerPose === 'idle');
    // Regression: a stopped scene's key listener must not leak into the level
    // (previously the title screen's handler hijacked S to open Settings).
    const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
    expect(state?.scene).toBe('level');

    // Aim up standing still, then diagonally while moving.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.playerPose === 'aim-up');
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.playerPose === 'aim-diag');
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimUp'));

    // Pit death: death pose during the death pause, then respawn with one less life.
    const livesAtStart = (await runtime(page))?.lives ?? 0;
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      return r?.dying === true && r?.playerPose === 'death';
    });
    // livesAtStart must be passed in: waitForFunction runs in the browser.
    await page.waitForFunction((n) => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      return r?.lives === n - 1 && r?.dying === false;
    }, livesAtStart);
    const settled = await runtime(page);
    expect(settled?.playerPose).toBe('idle');

    expect(pageErrors).toEqual([]);
  });
});
