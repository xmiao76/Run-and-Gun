import { expect, test } from '@playwright/test';

/**
 * Level 1 boss presentation (TASK-006): the Siege Walker must render as a
 * large, detailed sprite (not a rectangle) during the fight, and disappear
 * once defeated.
 */
test.describe('siege walker boss visuals', () => {
  test('boss renders as its sprite during the fight and hides on defeat', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Enter the arena (staged hop so the camera window keeps up).
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);

    const bossVisual = await page.evaluate(() => {
      const scene = window.__GAME__?.scene.getScene('level');
      if (!scene) {
        return null;
      }
      for (const c of scene.children.list) {
        const o = c as unknown as { type: string; visible: boolean; texture?: { key?: string }; displayWidth: number; displayHeight: number };
        if (o.type === 'Image' && o.visible && o.texture?.key === 'art/boss-siege-walker') {
          return { texture: o.texture.key, width: o.displayWidth, height: o.displayHeight };
        }
      }
      return null;
    });
    expect(bossVisual).not.toBeNull();
    // Stretched to the 64x56 hitbox: clearly larger than standard enemies (<=24px).
    expect(bossVisual?.width).toBe(64);
    expect(bossVisual?.height).toBe(56);

    // Defeat: the sprite hides once the boss is down.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('defeatBoss'));
    await page.waitForFunction(() => (window.__GAME_DEBUG__?.getState()?.runtime?.bossHealth ?? 1) === 0);
    const hidden = await page.evaluate(() => {
      const scene = window.__GAME__?.scene.getScene('level');
      if (!scene) {
        return true;
      }
      return scene.children.list.every((c) => {
        const o = c as unknown as { type: string; visible: boolean; texture?: { key?: string } };
        return o.texture?.key !== 'art/boss-siege-walker' || !o.visible;
      });
    });
    expect(hidden).toBe(true);

    expect(pageErrors).toEqual([]);
  });
});
