import { expect, test } from '@playwright/test';

/**
 * Menu navigation across devices (TASK-010): menus must be usable with
 * gamepad and touch, not only the keyboard.
 */
test.describe('menu navigation by gamepad and touch', () => {
  test('gamepad A starts the game from the title screen', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.addInitScript(() => {
      const padState = {
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }))
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
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    // A button (0) confirms: level 1 starts without any keyboard input.
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[0].pressed = true;
    });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[0].pressed = false;
    });

    expect(pageErrors).toEqual([]);
  });

  test('a tap starts the game, and a tap restarts after game over', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    // Tap (pointer) confirms on the title screen.
    await page.mouse.click(480, 270);
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Force game over; tap restarts the level.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('triggerGameOver'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'gameOver');
    await page.mouse.click(480, 270);
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      return r?.level === 'jungle-outpost' && (r.lives as number) === 3;
    });

    expect(pageErrors).toEqual([]);
  });

  test('gamepad Back on the game-over screen returns to title', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.addInitScript(() => {
      const padState = {
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }))
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
    await page.evaluate(() => window.__GAME_DEBUG__?.command('triggerGameOver'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'gameOver');

    await page.evaluate(() => {
      (window as unknown as { __padState: { buttons: { pressed: boolean }[] } }).__padState.buttons[8].pressed = true;
    });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    expect(pageErrors).toEqual([]);
  });
});
