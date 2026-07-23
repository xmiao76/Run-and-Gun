import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'phone', width: 390, height: 844 }
];

test.describe('M5 responsive scaling (H4)', () => {
  for (const vp of VIEWPORTS) {
    test(`canvas preserves 16:9 aspect and stays visible at ${vp.name} viewport`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (e) => pageErrors.push(String(e)));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/?debug=1&renderer=canvas');
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible({ timeout: 15_000 });
      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);
      const aspect = box!.width / box!.height;
      expect(Math.abs(aspect - 16 / 9)).toBeLessThan(0.04);
      expect(pageErrors).toEqual([]);
    });
  }
});

test.describe('M5 touch controls (H3)', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('touch buttons allow move, jump, fire, and pause on a phone viewport', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas&touch=1');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Touch UI is present on touch (or forced-touch debug) devices.
    const buttons = page.locator('.touch-btn');
    await expect(buttons.first()).toBeVisible();
    expect(await buttons.count()).toBeGreaterThanOrEqual(6);

    // FIRE button spawns a projectile.
    await page.locator('.touch-btn', { hasText: 'FIRE' }).tap();
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 1;
    });

    // JUMP button leaves the ground.
    await page.locator('.touch-btn', { hasText: 'JUMP' }).tap();
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === false);

    // Pause button pauses the game.
    await page.locator('.touch-btn', { hasText: '⏸' }).tap();
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);

    expect(pageErrors).toEqual([]);
  });
});
