import { expect, test } from '@playwright/test';

type Page = import('@playwright/test').Page;

const SETTINGS_KEY = 'operation-iron-echo:settings:v1';

async function startLevel1(page: Page, weapon = 'rapid'): Promise<void> {
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.evaluate((w) => window.__GAME_DEBUG__?.command('startAtCheckpoint', { id: 'start', weapon: w }), weapon);
}

/**
 * Step one at a time into the pit and record whether each step was frozen.
 *
 * A pit death is the trigger to build these tests on: it fires every single
 * time. Boss hits also freeze, but only land when the boss is in a vulnerable
 * window - an earlier draft of this spec used boss fire and silently tested
 * NOTHING, because "no freeze ever happened" satisfies both "the step count is
 * right" and "reduced flash suppressed it".
 */
async function pitDeathTrace(page: Page, steps = 40): Promise<string> {
  return page.evaluate((n) => {
    const b = window.__GAME_DEBUG__;
    b?.command('teleportPlayer', { x: 780, y: 800 });
    let trace = '';
    for (let i = 0; i < n; i++) {
      b?.command('advanceSteps', 1);
      const r = b?.getState()?.runtime as { hitStopped?: boolean } | undefined;
      trace += r?.hitStopped === true ? 'F' : '.';
    }
    return trace;
  }, steps);
}

/**
 * TASK-037: arcade feedback.
 *
 * The hit-stop state machine is unit-tested in isolation; what needs a real
 * scene is that freezing the world does not break the fixed-step contract the
 * whole automation harness rests on.
 */
test.describe('arcade feedback', () => {
  test('a heavy impact freezes the world for a bounded run of steps', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await startLevel1(page);

    const trace = await pitDeathTrace(page);

    // The freeze must actually happen (this is the assertion that keeps the
    // rest of this file honest)...
    expect(trace).toMatch(/F/);
    // ...be one unbroken run...
    expect(trace).toMatch(/^\.*F+\.*$/);
    // ...and end well inside the death pause rather than running on.
    const frozen = (trace.match(/F/g) ?? []).length;
    expect(frozen).toBeGreaterThanOrEqual(2);
    expect(frozen).toBeLessThanOrEqual(10);
    expect(pageErrors).toEqual([]);
  });

  test('advanceSteps still advances exactly the steps it reports across a freeze', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await startLevel1(page);

    const before = await page.evaluate(
      () => (window.__GAME_DEBUG__?.getState()?.runtime as { stepIndex?: number } | undefined)?.stepIndex ?? 0
    );

    // A batch that straddles the death freeze: the freeze is guaranteed to be
    // inside it, so this is the contract under the exact condition that could
    // break it.
    const reported = await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.command('teleportPlayer', { x: 780, y: 800 });
      const result = b?.command('advanceSteps', 30) as { steps?: number } | undefined;
      return result?.steps ?? -1;
    });

    const after = await page.evaluate(
      () => (window.__GAME_DEBUG__?.getState()?.runtime as { stepIndex?: number } | undefined)?.stepIndex ?? 0
    );

    expect(reported).toBe(30);
    // Every reported step is a real step: a frozen step is still a step.
    // `teleportPlayer` does not itself step, so the only delta is the batch.
    expect(after - before).toBe(30);
  });

  test('the world holds still on a frozen step while the step counter advances', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await startLevel1(page);

    const observed = await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.command('teleportPlayer', { x: 780, y: 800 });
      b?.input('holdRight');
      let found = false;
      let movedWhileFrozen = true;
      let stepAdvanced = false;
      for (let i = 0; i < 60 && !found; i++) {
        const before = b?.getState()?.runtime as { playerX?: number; stepIndex?: number } | undefined;
        b?.command('advanceSteps', 1);
        const after = b?.getState()?.runtime as
          | { playerX?: number; stepIndex?: number; hitStopped?: boolean }
          | undefined;
        if (after?.hitStopped === true) {
          found = true;
          // Held: walking input must move nothing on a frozen step.
          movedWhileFrozen = (after.playerX ?? 0) !== (before?.playerX ?? 0);
          stepAdvanced = (after.stepIndex ?? 0) === (before?.stepIndex ?? 0) + 1;
        }
      }
      b?.input('releaseRight');
      return { found, movedWhileFrozen, stepAdvanced };
    });

    expect(observed.found).toBe(true);
    expect(observed.movedWhileFrozen).toBe(false);
    expect(observed.stepAdvanced).toBe(true);
  });

  test('reduced flash suppresses the freeze that otherwise always fires', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Baseline first, in this same browser: prove the trigger freezes at all,
    // so a suppressed result below means something.
    await startLevel1(page);
    expect(await pitDeathTrace(page)).toMatch(/F/);

    await page.evaluate((key) => {
      const stored = JSON.parse(window.localStorage.getItem(key) ?? '{}');
      window.localStorage.setItem(key, JSON.stringify({ ...stored, reducedFlash: true, mute: true }));
    }, SETTINGS_KEY);
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await startLevel1(page);

    // Same death, same trace, and now not one frozen step.
    expect(await pitDeathTrace(page)).not.toMatch(/F/);
  });

  test('a death throws an explosion, not a handful of squares', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await startLevel1(page);

    const peak = await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.command('teleportPlayer', { x: 780, y: 800 });
      let most = 0;
      for (let i = 0; i < 40; i++) {
        b?.command('advanceSteps', 1);
        const r = b?.getState()?.runtime as { particleCount?: number } | undefined;
        most = Math.max(most, r?.particleCount ?? 0);
      }
      return most;
    });

    // The burst this replaced was 8 particles; an explosion is 10 + 6 + 1.
    expect(peak).toBeGreaterThan(8);
  });
});
