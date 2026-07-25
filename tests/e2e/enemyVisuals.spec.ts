import { expect, test } from '@playwright/test';

async function visibleEnemyTextures(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    if (!scene) {
      return [];
    }
    return scene.children.list
      .map((c) => c as unknown as { type: string; visible: boolean; texture?: { key?: string } })
      .filter((o) => o.type === 'Image' && o.visible && (o.texture?.key ?? '').startsWith('art/enemy-'))
      .map((o) => o.texture?.key ?? '');
  });
}

/**
 * Enemy visual identities (TASK-004): every archetype on screen must render as
 * its own recognizable sprite, and enemy projectiles must be sprite orbs.
 */
test.describe('enemy visual identities', () => {
  test('all four enemy kinds render as distinct sprites in level 1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Wave 1: runner + drone.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { enemyCount?: number } | null | undefined;
      return (r?.enemyCount ?? 0) >= 2;
    });
    let textures = await visibleEnemyTextures(page);
    expect(textures).toContain('art/enemy-runner');
    expect(textures).toContain('art/enemy-drone');

    // Wave 2: sentry + grenadier. Hop forward in stages so the camera (and its
    // spawn-culling window, which lags one step) keeps up with the teleports.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 800 }));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { playerX?: number } | null | undefined;
      return (r?.playerX ?? 0) >= 800;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1030 }));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { enemyCount?: number } | null | undefined;
      return (r?.enemyCount ?? 0) >= 4;
    });
    textures = await visibleEnemyTextures(page);
    expect(textures).toContain('art/enemy-sentry');
    expect(textures).toContain('art/enemy-grenadier');

    // Distinctness across the whole wave.
    expect(new Set(textures).size).toBe(4);

    // Enemy fire arrives as sprite orbs, not rectangles.
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { enemyProjectileCount?: number } | null | undefined;
      return (r?.enemyProjectileCount ?? 0) >= 1;
    });
    const orbs = await page.evaluate(() => {
      const scene = window.__GAME__?.scene.getScene('level');
      if (!scene) {
        return 0;
      }
      return scene.children.list.filter((c) => {
        const o = c as unknown as { type: string; visible: boolean; texture?: { key?: string } };
        return o.type === 'Image' && o.visible && o.texture?.key === 'art/bullet-enemy';
      }).length;
    });
    expect(orbs).toBeGreaterThanOrEqual(1);

    expect(pageErrors).toEqual([]);
  });
});
