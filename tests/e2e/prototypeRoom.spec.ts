import { expect, test } from '@playwright/test';

/**
 * Presentation baseline for the prototype room: the playable scene must render
 * the pixel-art sprite sheet (player character, environment tiles) rather than
 * abstract rectangles. Uses the debug-only __GAME__ handle to inspect the
 * Phaser texture manager and display list.
 */
test.describe('prototype room presentation', () => {
  test('opens from the title screen and renders sprite art, not blocks', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Real keyboard path: P on the title screen opens the prototype room.
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('KeyP');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'sandbox');
    // Let the scene render a few frames before inspecting the display list.
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { grounded?: boolean } | null | undefined;
      return r?.grounded === true;
    });

    const info = await page.evaluate(() => {
      const game = window.__GAME__;
      if (!game) {
        return null;
      }
      const scene = game.scene.getScene('sandbox');
      const display = scene.children.list.map((child) => {
        const go = child as unknown as { type: string; texture?: { key?: string } };
        return { type: go.type, texture: go.texture?.key ?? null };
      });
      return {
        textures: {
          player: game.textures.exists('art/player-idle'),
          enemyRunner: game.textures.exists('art/enemy-runner'),
          ground: game.textures.exists('art/tile-ground'),
          sky: game.textures.exists('art/bg-sky')
        },
        display
      };
    });

    expect(info).not.toBeNull();
    expect(info?.textures).toEqual({ player: true, enemyRunner: true, ground: true, sky: true });

    // The player character is a sprite image using the authored pixel art.
    expect(info?.display).toContainEqual({ type: 'Image', texture: 'art/player-idle' });
    // Environment art is present as tiled sprites (ground tiles / ridge band).
    const tileSpriteTextures = info?.display.filter((d) => d.type === 'TileSprite').map((d) => d.texture) ?? [];
    expect(tileSpriteTextures).toContain('art/tile-ground');
    expect(tileSpriteTextures).toContain('art/bg-ridge');

    expect(pageErrors).toEqual([]);
  });
});
