import { expect, test } from '@playwright/test';

/**
 * Manual-clock mode (`?manualClock`, debug-only): wall time never advances the
 * simulation - only the `advanceSteps` debug command does. This gives
 * programmatic drivers step-exact determinism: bridge input edges persist
 * until the driver's own step consumes them, so multi-turn agents never race
 * the render loop.
 */

type Runtime = {
  level?: string;
  manualClock?: boolean;
  playerX?: number;
  projectileCount?: number;
  grounded?: boolean;
};

const rt = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime as Runtime | null | undefined);

test.describe('manual clock', () => {
  test('freezes the level simulation and holds input edges until the agent steps', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    expect((await rt(page))?.manualClock).toBe(true);
    const startX = (await rt(page))?.playerX ?? 0;

    // A fire edge must survive real frames: with the clock frozen, nothing
    // consumes it until advanceSteps runs.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForTimeout(500);
    let r = await rt(page);
    expect(r?.projectileCount).toBe(0);
    expect(r?.playerX).toBe(startX);

    // The agent is the only clock: stepping consumes the edge and fires.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 3));
    r = await rt(page);
    expect(r?.projectileCount ?? 0).toBeGreaterThanOrEqual(1);
  });

  test('movement happens only when the agent steps', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const startX = (await rt(page))?.playerX ?? 0;
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForTimeout(400);
    // Held input alone must not move the player while the clock is frozen.
    expect((await rt(page))?.playerX).toBe(startX);

    // 30 steps at 60 Hz = 0.5 s of simulation: ~107 px at MOVE_SPEED 215.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 30));
    const movedX = (await rt(page))?.playerX ?? 0;
    expect(movedX - startX).toBeGreaterThan(50);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));
  });

  test('real-time play is unchanged without the flag, and setManualClock toggles it at runtime', async ({ page }) => {
    await page.goto('/?debug=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    expect((await rt(page))?.manualClock).toBe(false);

    // Existing real-time behaviour: atomic press+step fires (the established
    // anti-race pattern), asserting inside the same evaluate so real-time
    // steps cannot expire the projectile before the read.
    const count = await page.evaluate(() => {
      window.__GAME_DEBUG__?.input('firePress');
      window.__GAME_DEBUG__?.command('advanceSteps', 2);
      const r = window.__GAME_DEBUG__?.getState()?.runtime as Runtime | null | undefined;
      return r?.projectileCount ?? 0;
    });
    expect(count).toBeGreaterThanOrEqual(1);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('resetInput'));

    // Runtime toggle freezes the scene without a reload.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('setManualClock', true));
    expect((await rt(page))?.manualClock).toBe(true);
    const x = (await rt(page))?.playerX ?? 0;
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForTimeout(300);
    expect((await rt(page))?.playerX).toBe(x);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('resetInput'));
  });

  test('the sandbox scene honours the manual clock too', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startSandbox'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'sandbox');

    expect((await rt(page))?.manualClock).toBe(true);
    expect((await rt(page))?.grounded).toBe(true);

    // A jump edge persists through real frames, then the agent's step applies it.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpPress'));
    await page.waitForTimeout(300);
    expect((await rt(page))?.grounded).toBe(true);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 2));
    expect((await rt(page))?.grounded).toBe(false);
  });
});
