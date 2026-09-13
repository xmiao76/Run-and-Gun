import { expect, test } from '@playwright/test';

const SETTINGS_KEY = 'operation-iron-echo:settings:v1';

/** Does the level scene currently show the scanline overlay? */
async function scanlinesVisible(page: import('@playwright/test').Page): Promise<boolean> {
  return page.evaluate(() => {
    const game = (window as unknown as { __GAME__?: Phaser.Game }).__GAME__;
    const scene = game?.scene.getScenes(true)[0];
    return (
      scene?.children.list.some(
        (o) =>
          o.type === 'TileSprite' &&
          (o as Phaser.GameObjects.TileSprite).texture?.key === 'art/scanline' &&
          (o as Phaser.GameObjects.TileSprite).visible
      ) ?? false
    );
  });
}

/**
 * TASK-034: the CRT scanline option.
 *
 * Opt-in, persisted, and covering the whole view including the HUD. It is a
 * TileSprite rather than a shader precisely so these assertions can see it
 * under the canvas renderer the suite forces.
 */
test.describe('scanlines option', () => {
  test('is off by default, and the settings row toggles it on', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    expect(await scanlinesVisible(page)).toBe(false);

    await page.evaluate(() => window.__GAME_DEBUG__?.command('gotoTitle'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('s');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'settings');
    await page.keyboard.press('c');

    // The toggle is reflected in the settings runtime...
    await page.waitForFunction(
      () => (window.__GAME_DEBUG__?.getState()?.runtime as { scanlines?: boolean } | undefined)?.scanlines === true
    );

    // ...and the overlay is live immediately, on the settings screen itself.
    expect(await scanlinesVisible(page)).toBe(true);

    await page.keyboard.press('c');
    await page.waitForFunction(
      () => (window.__GAME_DEBUG__?.getState()?.runtime as { scanlines?: boolean } | undefined)?.scanlines === false
    );
    expect(await scanlinesVisible(page)).toBe(false);

    expect(pageErrors).toEqual([]);
  });

  test('the choice persists across a page reload', async ({ page }) => {
    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          musicVolume: 0,
          sfxVolume: 0,
          mute: true,
          reducedFlash: false,
          scanlines: true,
          controls: 'keyboard',
          bestScore: 0,
          startingLives: 30
        })
      );
    }, SETTINGS_KEY);

    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    expect(await scanlinesVisible(page)).toBe(true);
  });

  test('the overlay sits above the HUD and covers the full view', async ({ page }) => {
    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate((key) => {
      const stored = JSON.parse(window.localStorage.getItem(key) ?? '{}');
      window.localStorage.setItem(key, JSON.stringify({ ...stored, scanlines: true }));
    }, SETTINGS_KEY);
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const overlay = await page.evaluate(() => {
      const game = (window as unknown as { __GAME__?: Phaser.Game }).__GAME__;
      const scene = game?.scene.getScene('level');
      const o = scene?.children.list.find(
        (c) => c.type === 'TileSprite' && (c as Phaser.GameObjects.TileSprite).texture?.key === 'art/scanline'
      ) as Phaser.GameObjects.TileSprite | undefined;
      return o ? { depth: o.depth, width: o.width, height: o.height, visible: o.visible } : null;
    });

    expect(overlay).not.toBeNull();
    // Above the HUD (100) and the pause/level overlays (110).
    expect(overlay?.depth).toBeGreaterThan(110);
    expect(overlay?.width).toBe(960);
    expect(overlay?.height).toBe(540);
    expect(overlay?.visible).toBe(true);
  });
});
