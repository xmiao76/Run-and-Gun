import { expect, test } from '@playwright/test';

/**
 * Per-level AI autoplay toggle (TASK-019): the I key switches the pilot on/off
 * on any level, the choice persists across level transitions and restarts, and
 * with the toggle on the AI plays through both levels hands-free (results
 * auto-advance), while a human keeps full control when it is off.
 */

type AiRuntime = {
  level?: string;
  autopilot?: boolean;
  bossActive?: boolean;
  final?: boolean;
};

const rt = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime as AiRuntime | null | undefined);

test.describe('per-level AI autoplay toggle', () => {
  test('the I key toggles the AI pilot on and off during a level', async ({ page }) => {
    await page.goto('/?debug=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('Enter'); // normal start, AI off
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    expect((await rt(page))?.autopilot).toBe(false);

    await page.keyboard.press('i'); // toggle on
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.autopilot === true);

    await page.keyboard.press('i'); // toggle off
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.autopilot === false);
  });

  test('with the toggle on, the AI plays the whole game hands-free', async ({ page }) => {
    test.setTimeout(240_000);
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('i'); // AI on, start Level 1
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // AI completes Level 1 -> results.
    for (let i = 0; i < 120; i++) {
      const scene = await page.evaluate(() => {
        window.__GAME_DEBUG__?.command('advanceSteps', 600);
        return window.__GAME_DEBUG__?.getState()?.scene;
      });
      if (scene === 'results') {
        break;
      }
    }
    expect(await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.scene)).toBe('results');

    // Results auto-advances (real time) into the next stage, pilot still on.
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior', null, {
      timeout: 10_000
    });
    expect((await rt(page))?.autopilot).toBe(true);

    // Then play out every remaining stage until the ending. Written as a loop
    // over stages rather than one leg per level, so adding a stage extends the
    // AI's job without needing this test rewritten again (TASK-039).
    let final = false;
    let stagesPlayed = 1;
    for (let stage = 0; stage < 8 && !final; stage++) {
      for (let i = 0; i < 300; i++) {
        const s = await page.evaluate(() => {
          window.__GAME_DEBUG__?.command('advanceSteps', 600);
          return window.__GAME_DEBUG__?.getState();
        });
        if (s?.scene === 'results') {
          final = (s?.runtime as AiRuntime | null)?.final === true;
          stagesPlayed += 1;
          break;
        }
      }
      if (final) {
        break;
      }
      // Intermediate results auto-advance; wait for the next level to start.
      await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'level', null, {
        timeout: 15_000
      });
    }
    expect(final).toBe(true);
    // The pilot really played every stage, not just the first and last.
    expect(stagesPlayed).toBeGreaterThanOrEqual(3);
    expect(pageErrors).toEqual([]);
  });

  test('the results screen waits for the player when the AI toggle is off', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('Enter'); // normal start, AI off
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Force Level 1 completion through the debug bridge (not the AI). Under the
    // manual clock, teleports need advanceSteps to drive the sim forward.
    await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.command('teleportPlayer', { x: 2600 });
      b?.command('advanceSteps', 5); // boss activates on the step
    });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
    await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.command('defeatBoss');
      b?.command('teleportPlayer', { x: 3190 });
      b?.command('advanceSteps', 120); // completion timer elapses in stepOnce
    });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'results', null, { timeout: 10_000 });

    // Toggle is off: results must NOT auto-advance past the 2 s window.
    await page.waitForTimeout(3000);
    expect(await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.scene)).toBe('results');
  });
});

/**
 * TASK-025: taking over from the pilot must honour the FIRST press.
 *
 * Edges were derived from the previous step's merged input, which includes
 * whatever the pilot asked for. While the pilot held jump, a human's first real
 * press read as a continuation of that hold and was dropped, so the player had
 * to release and press again before the game responded.
 */
test('a human jump press is honoured on the very step it takes over from the pilot', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto('/?debug=1&manualClock=1&renderer=canvas');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('i');
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.autopilot === true);

  // Fast-forward until the pilot is airborne on a jump it is holding: that is
  // the exact state whose held flag used to swallow the human's press.
  let airborne = false;
  for (let i = 0; i < 200 && !airborne; i++) {
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 4));
    airborne = await page.evaluate(
      () => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === false
    );
  }
  expect(airborne).toBe(true);

  // Land, so a jump is legal again, while the pilot is still driving.
  for (let i = 0; i < 200; i++) {
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 4));
    const state = await page.evaluate(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as
        | { grounded?: boolean; autopilot?: boolean; playerY?: number }
        | undefined;
      return { grounded: r?.grounded, autopilot: r?.autopilot, y: r?.playerY };
    });
    if (state.grounded && state.autopilot) {
      break;
    }
  }

  const before = await page.evaluate(
    () => (window.__GAME_DEBUG__?.getState()?.runtime as { playerY?: number })?.playerY ?? 0
  );

  // One real key press, held across a few steps - the takeover.
  await page.keyboard.down('z');
  await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 10));
  const after = await page.evaluate(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime as
      | { playerY?: number; autopilot?: boolean; grounded?: boolean }
      | undefined;
    return { y: r?.playerY ?? 0, autopilot: r?.autopilot, grounded: r?.grounded };
  });
  await page.keyboard.up('z');

  // The human is now driving, and the jump actually left the ground: y is
  // measured from the top, so rising means a smaller value.
  expect(after.autopilot).toBe(false);
  expect(after.y).toBeLessThan(before);
  expect(after.grounded).toBe(false);
  expect(pageErrors).toEqual([]);
});
