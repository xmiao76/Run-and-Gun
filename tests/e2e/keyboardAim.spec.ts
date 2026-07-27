import { expect, test } from '@playwright/test';

type Page = import('@playwright/test').Page;

function fireAngle(page: Page): Promise<number | undefined> {
  return page.evaluate(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime as { fireAngle?: number } | null | undefined;
    return r?.fireAngle;
  });
}

function pose(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime as { playerPose?: string } | null | undefined;
    return r?.playerPose;
  });
}

function grounded(page: Page): Promise<boolean | undefined> {
  return page.evaluate(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime as { grounded?: boolean } | null | undefined;
    return r?.grounded;
  });
}

/** Advance the fixed-step simulation deterministically while keys stay held. */
function step(page: Page, steps: number): Promise<unknown> {
  return page.evaluate((n) => window.__GAME_DEBUG__?.command('advanceSteps', n), steps);
}

/**
 * Keyboard aiming (TASK-012): every one of the eight fire directions must be
 * reachable with the real PC bindings - arrows to aim, Z to jump, X to fire.
 *
 * Real key presses drive the bindings; `advanceSteps` drives the clock so the
 * short airborne window is deterministic instead of wall-clock dependent.
 */
test.describe('keyboard aiming in all directions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  });

  test('grounded: forward, straight up, and both up-diagonals', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    // Forward (facing right by default).
    await page.keyboard.down('x');
    await step(page, 2);
    expect(await fireAngle(page)).toBe(0);
    await page.keyboard.up('x');
    await step(page, 20);

    // Straight up: Arrow Up alone.
    await page.keyboard.down('ArrowUp');
    await page.keyboard.down('x');
    await step(page, 2);
    expect(await fireAngle(page)).toBe(-90);
    expect(await pose(page)).toBe('aim-up');
    // Aiming up must never leave the ground.
    expect(await grounded(page)).toBe(true);
    await page.keyboard.up('x');
    await step(page, 20);

    // Up + Right => -45, with the diagonal pose.
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('x');
    await step(page, 2);
    expect(await fireAngle(page)).toBe(-45);
    expect(await pose(page)).toBe('aim-diag');
    await page.keyboard.up('x');
    await page.keyboard.up('ArrowRight');
    await step(page, 20);

    // Up + Left => -135 (facing flips left).
    await page.keyboard.down('ArrowLeft');
    await step(page, 6);
    await page.keyboard.down('x');
    await step(page, 2);
    expect(await fireAngle(page)).toBe(-135);
    await page.keyboard.up('x');
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.up('ArrowUp');

    expect(pageErrors).toEqual([]);
  });

  test('airborne: straight down and both down-diagonals', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    /**
     * One jump per shot: the airborne window is ~0.7s and the pulse cooldown is
     * 0.22s, so three shots do not fit in a single jump. Down is pressed only
     * after leaving the ground, because crouching blocks a jump.
     */
    const airborneShot = async (direction: string | null, expected: number): Promise<void> => {
      await page.keyboard.down('z');
      await step(page, 4);
      expect(await grounded(page)).toBe(false);

      await page.keyboard.down('ArrowDown');
      if (direction) {
        await page.keyboard.down(direction);
      }
      await page.keyboard.down('x');
      await step(page, 2);
      expect(await grounded(page), `still airborne for angle ${expected}`).toBe(false);
      expect(await fireAngle(page)).toBe(expected);

      await page.keyboard.up('x');
      await page.keyboard.up('ArrowDown');
      if (direction) {
        await page.keyboard.up(direction);
      }
      await page.keyboard.up('z');
      // Land, and let the weapon cooldown elapse before the next shot.
      await step(page, 60);
      expect(await grounded(page)).toBe(true);
    };

    await airborneShot(null, 90);
    await airborneShot('ArrowRight', 45);
    await airborneShot('ArrowLeft', 135);

    expect(pageErrors).toEqual([]);
  });

  test('grounded Down is crouch-fire forward, not a downward shot', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.keyboard.down('ArrowDown');
    await step(page, 4);
    expect(await pose(page)).toBe('crouch');
    await page.keyboard.down('x');
    await step(page, 2);
    expect(await fireAngle(page)).toBe(0);
    await page.keyboard.up('x');
    await page.keyboard.up('ArrowDown');

    expect(pageErrors).toEqual([]);
  });

  test('every diagonal projectile is rotated along its flight vector', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.keyboard.down('ArrowUp');
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('x');
    await step(page, 2);

    const rotations = await page.evaluate(() => {
      const scene = window.__GAME__?.scene.getScene('level');
      if (!scene) {
        return [];
      }
      return scene.children.list
        .map((c) => c as unknown as { type: string; visible: boolean; texture?: { key?: string }; rotation: number })
        .filter((o) => o.type === 'Image' && o.visible && (o.texture?.key ?? '').startsWith('art/bullet-'))
        .map((o) => o.rotation);
    });
    expect(rotations.length).toBeGreaterThanOrEqual(1);
    // -45 degrees in radians.
    expect(rotations.some((r) => Math.abs(r + Math.PI / 4) < 0.01)).toBe(true);

    await page.keyboard.up('x');
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('ArrowUp');

    expect(pageErrors).toEqual([]);
  });
});
