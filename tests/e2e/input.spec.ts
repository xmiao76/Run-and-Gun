import { expect, test } from '@playwright/test';

interface LevelRuntime {
  level?: string;
  playerX?: number;
  grounded?: boolean;
  paused?: boolean;
  fireAngle?: number;
  projectileCount?: number;
  lives?: number;
}

async function rt(page: import('@playwright/test').Page): Promise<LevelRuntime> {
  const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
  return (state?.runtime ?? {}) as LevelRuntime;
}

test.describe('M5 eight-direction aiming (C4)', () => {
  test('aims up, diagonally, down while airborne, and crouch-forward', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Straight up.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.fireAngle === -90);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimUp'));

    // Diagonal up-right while holding right.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
    await page.waitForTimeout(250);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.fireAngle === -45);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimUp'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));

    // Downward while airborne: fire during the ascent (jump held). Let the
    // weapon cooldown from the previous shot elapse first.
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpPress'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === false);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimDown'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.fireAngle === 90);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimDown'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpRelease'));

    // Crouch-fire forward while grounded (cooldown elapses during landing,
    // but wait to be deterministic).
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === true);
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimDown'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.fireAngle === 0);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimDown'));

    expect(pageErrors).toEqual([]);
  });
});

test.describe('M5 gamepad and focus loss', () => {
  test('a connected gamepad drives movement, jump, fire, and pause (H2)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.addInitScript(() => {
      const padState = {
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
      };
      (window as unknown as { __padState: typeof padState }).__padState = padState;
      const fakePad = {
        get axes() {
          return padState.axes;
        },
        get buttons() {
          return padState.buttons;
        },
        get connected() {
          return true;
        },
        id: 'FakePad',
        index: 0,
        mapping: 'standard',
        timestamp: 0
      };
      navigator.getGamepads = () => [fakePad as unknown as Gamepad];
    });

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const startX = (await rt(page)).playerX ?? 0;

    // Stick right -> move.
    await page.evaluate(() => {
      (window as unknown as { __padState: { axes: number[] } }).__padState.axes[0] = 1;
    });
    await page.waitForFunction((sx) => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { playerX?: number } | null | undefined;
      return r !== null && r !== undefined && (r.playerX ?? 0) > sx + 5;
    }, startX);
    await page.evaluate(() => {
      (window as unknown as { __padState: { axes: number[] } }).__padState.axes[0] = 0;
    });

    // A button -> jump.
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[0].pressed = true;
    });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === false);
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[0].pressed = false;
    });

    // X button -> fire.
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[2].pressed = true;
    });
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 1;
    });
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[2].pressed = false;
    });

    // Start -> pause, Start again -> resume.
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[9].pressed = true;
    });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[9].pressed = false;
    });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[9].pressed = true;
    });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === false);
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[9].pressed = false;
    });

    expect(pageErrors).toEqual([]);
  });

  test('losing window focus pauses and freezes the simulation (H5)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);

    // While paused the player does not move even with input held.
    const x1 = (await rt(page)).playerX;
    await page.waitForTimeout(300);
    const x2 = (await rt(page)).playerX;
    expect(x2).toBe(x1);

    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));
    await page.evaluate(() => window.__GAME_DEBUG__?.command('resume'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === false);

    expect(pageErrors).toEqual([]);
  });
});
