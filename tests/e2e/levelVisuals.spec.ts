import { expect, test } from '@playwright/test';

async function environmentInfo(page: import('@playwright/test').Page): Promise<{
  groundTiles: number;
  ridgeTilePositionX: number;
  horizonImages: number;
  crateImages: number;
}> {
  return page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    if (!scene) {
      return { groundTiles: 0, ridgeTilePositionX: 0, horizonImages: 0, crateImages: 0 };
    }
    let groundTiles = 0;
    let ridgeTilePositionX = 0;
    let horizonImages = 0;
    let crateImages = 0;
    for (const c of scene.children.list) {
      const o = c as unknown as { type: string; visible: boolean; texture?: { key?: string }; tilePositionX?: number };
      const key = o.texture?.key ?? '';
      if (o.type === 'TileSprite' && key === 'art/tile-ground') {
        groundTiles += 1;
      }
      if (o.type === 'TileSprite' && key === 'art/bg-ridge') {
        ridgeTilePositionX = o.tilePositionX ?? 0;
      }
      if (o.type === 'Image' && o.visible && (key === 'art/bg-tree' || key === 'art/bg-ruin')) {
        horizonImages += 1;
      }
      if (o.type === 'Image' && o.visible && key === 'art/pickup-crate') {
        crateImages += 1;
      }
    }
    return { groundTiles, ridgeTilePositionX, horizonImages, crateImages };
  });
}

/**
 * Level 1 environment (TASK-005): textured terrain, layered parallax backdrop,
 * horizon silhouettes, and crate pickups - not colored blocks.
 */
test.describe('level 1 environment art', () => {
  test('renders themed terrain, parallax layers, and props', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const atStart = await environmentInfo(page);
    expect(atStart.groundTiles).toBeGreaterThanOrEqual(1);
    expect(atStart.horizonImages).toBeGreaterThanOrEqual(1);
    expect(atStart.crateImages).toBeGreaterThanOrEqual(1);

    // Parallax: the ridge band scrolls slower than the camera.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1000 }));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { playerX?: number } | null | undefined;
      return (r?.playerX ?? 0) >= 1000;
    });
    const afterMove = await environmentInfo(page);
    expect(afterMove.ridgeTilePositionX).toBeGreaterThan(atStart.ridgeTilePositionX + 50);
    // Camera moved 520px; a 0.3-factor layer must trail far behind that.
    expect(afterMove.ridgeTilePositionX).toBeLessThan(300);

    // Walk into the wave-1 trigger and fight briefly: scene stays stable.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 500 }));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { enemyCount?: number } | null | undefined;
      return (r?.enemyCount ?? 0) >= 2;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));

    expect(pageErrors).toEqual([]);
  });
});
