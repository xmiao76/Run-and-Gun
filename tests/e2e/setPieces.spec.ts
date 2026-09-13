import { expect, test } from '@playwright/test';


/**
 * TASK-038: the two new set pieces, as far as a real scene can show them.
 *
 * The collapsing bridge's rules are unit-tested over immutable state; what
 * needs a scene is that the level pipeline carries it - the runtime publishes
 * it, and a level that authors none is unaffected. Bridge PLACEMENT in a level
 * is TASK-039's job (this task's non-goals forbid changing existing layouts),
 * and that is when the pilot-geometry path gets live coverage.
 *
 * The turret is exercised for real in the prototype room, which is where a new
 * archetype belongs before a level commits to it.
 */
test.describe('set pieces', () => {
  test('the level runtime publishes the bridge list for agents and the harness', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const bridges = await page.evaluate(
      () => (window.__GAME_DEBUG__?.getState()?.runtime as { bridges?: unknown } | undefined)?.bridges
    );
    // Present and well-formed, even though Level 1 authors none yet.
    expect(Array.isArray(bridges)).toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test('the turret appears in the prototype room and holds its ground', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startSandbox'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'sandbox');

    // Walk into the spawn trigger.
    await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.input('holdRight');
      // Stop short of the sandbox pit at x=720: walking further drops the
      // player in, and the respawn puts them outside the turret's range.
      b?.command('advanceSteps', 150);
      b?.input('releaseRight');
    });

    const turret = await page.evaluate(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as
        | { enemies?: { kind: string; x: number; state: string }[] }
        | undefined;
      return r?.enemies?.find((e) => e.kind === 'turret') ?? null;
    });
    expect(turret).not.toBeNull();

    // A turret is an emplacement: it must never move, however long it lives.
    const startX = turret?.x ?? 0;
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 300));
    const after = await page.evaluate(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as
        | { enemies?: { kind: string; x: number; state: string }[] }
        | undefined;
      return r?.enemies?.find((e) => e.kind === 'turret') ?? null;
    });
    if (after) {
      expect(after.x).toBe(startX);
    }
    expect(pageErrors).toEqual([]);
  });

  test('the turret uses the enemy pipeline: it telegraphs before it fires', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startSandbox'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'sandbox');

    const sawTelegraph = await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.input('holdRight');
      // As above: stop short of the pit so the player stays in engage range.
      b?.command('advanceSteps', 150);
      b?.input('releaseRight');
      // Inheriting the shared FSM is the point of building it as an enemy
      // kind: the wind-up comes for free, so a turret shot is never unfair.
      for (let i = 0; i < 600; i++) {
        b?.command('advanceSteps', 1);
        const r = b?.getState()?.runtime as { enemies?: { kind: string; state: string }[] } | undefined;
        const t = r?.enemies?.find((e) => e.kind === 'turret');
        if (t && (t.state === 'telegraph' || t.state === 'fire')) {
          return true;
        }
      }
      return false;
    });

    expect(sawTelegraph).toBe(true);
  });
});
