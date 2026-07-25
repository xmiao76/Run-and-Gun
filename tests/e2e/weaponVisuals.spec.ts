import { expect, test } from '@playwright/test';

interface BulletShot {
  texture: string;
  rotation: number;
}

/** Visible projectile sprites currently on the level scene display list. */
async function visibleBullets(page: import('@playwright/test').Page): Promise<BulletShot[]> {
  return page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    if (!scene) {
      return [];
    }
    return scene.children.list
      .map((c) => c as unknown as { type: string; visible: boolean; texture?: { key?: string }; rotation: number })
      .filter((o) => o.type === 'Image' && o.visible && (o.texture?.key ?? '').startsWith('art/bullet'))
      .map((o) => ({ texture: o.texture?.key ?? '', rotation: o.rotation }));
  });
}

/**
 * Weapon visual identity (TASK-003): pulse, scatter, and rapid projectiles
 * must use distinct sprites, and the sprite must rotate with the aim angle.
 */
test.describe('weapon projectile visuals', () => {
  test('each weapon fires a visually distinct projectile', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Pulse rifle (default weapon): single bolt.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 1;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    let bullets = await visibleBullets(page);
    expect(bullets.length).toBeGreaterThanOrEqual(1);
    expect(bullets.every((b) => b.texture === 'art/bullet-pulse')).toBe(true);
    expect(Math.abs(bullets[0].rotation)).toBeLessThan(0.01);

    // Aimed straight up, the bolt sprite rotates to match.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { fireAngle?: number } | null | undefined;
      return (r?.fireAngle ?? 0) === -90;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimUp'));
    bullets = await visibleBullets(page);
    const upward = bullets.filter((b) => b.texture === 'art/bullet-pulse' && Math.abs(b.rotation + Math.PI / 2) < 0.1);
    expect(upward.length).toBeGreaterThanOrEqual(1);

    // Scatter blaster pickup: three chunky pellets per shot.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 360 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.weapon === 'scatter');
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 3;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    bullets = await visibleBullets(page);
    const pellets = bullets.filter((b) => b.texture === 'art/bullet-scatter');
    expect(pellets.length).toBeGreaterThanOrEqual(3);
    // The fanned pellets travel at different angles.
    expect(Math.abs(pellets[0].rotation - pellets[2].rotation)).toBeGreaterThan(0.1);

    // Rapid carbine pickup: slim cyan darts.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1700 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.weapon === 'rapid');
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 1;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    bullets = await visibleBullets(page);
    expect(bullets.some((b) => b.texture === 'art/bullet-rapid')).toBe(true);

    expect(pageErrors).toEqual([]);
  });
});
