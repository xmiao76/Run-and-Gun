import { expect, test } from '@playwright/test';

test.describe('title screen', () => {
  test('loads the production build to the title screen without uncaught errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(String(error));
    });

    // The debug query parameter enables the read-only __GAME_DEBUG__ bridge
    // so the test can observe scene state deterministically, and forces the
    // Canvas 2D renderer because headless Chromium's software WebGL backend
    // cannot compile Phaser's shaders. Production keeps WebGL via AUTO.
    await page.goto('/?debug=1&renderer=canvas');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Wait until the title scene is active.
    await page.waitForFunction(() => {
      const state = window.__GAME_DEBUG__?.getState();
      return state !== undefined && state.scene === 'title';
    });

    const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
    expect(state?.gameTitle).toBe('Operation Iron Echo');
    expect(state?.titleHeading).toBe('OPERATION IRON ECHO');
    expect(state?.scene).toBe('title');
    expect(pageErrors).toEqual([]);
  });
});
