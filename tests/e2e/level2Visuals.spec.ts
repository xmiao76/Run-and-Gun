import { expect, test } from '@playwright/test';

async function level2Environment(page: import('@playwright/test').Page): Promise<{
  metalTiles: number;
  wallBand: number;
  pipes: number;
  grate: number;
  doorImages: number;
  machineHorizon: number;
  jungleLeak: number;
}> {
  return page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    const out = { metalTiles: 0, wallBand: 0, pipes: 0, grate: 0, doorImages: 0, machineHorizon: 0, jungleLeak: 0 };
    if (!scene) {
      return out;
    }
    for (const c of scene.children.list) {
      const o = c as unknown as { type: string; visible: boolean; texture?: { key?: string } };
      const key = o.texture?.key ?? '';
      if (!o.visible) {
        continue;
      }
      if (key === 'art/tile-metal') out.metalTiles += 1;
      if (key === 'art/tile-wall') out.wallBand += 1;
      if (key === 'art/bg-pipes') out.pipes += 1;
      if (key === 'art/tile-grate') out.grate += 1;
      if (o.type === 'Image' && key === 'art/door-security') out.doorImages += 1;
      if (o.type === 'Image' && (key === 'art/bg-machine' || key === 'art/bg-column')) out.machineHorizon += 1;
      if (key === 'art/bg-tree' || key === 'art/tile-ground' || key === 'art/bg-stars') out.jungleLeak += 1;
    }
    return out;
  });
}

/**
 * Level 2 environment (TASK-007): industrial fortress identity - metal deck,
 * wall panels, pipes, machinery, security door - and no jungle leftovers.
 */
test.describe('level 2 fortress visuals', () => {
  test('renders the fortress theme distinctly from level 1', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel2'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');

    const env = await level2Environment(page);
    expect(env.metalTiles).toBeGreaterThanOrEqual(1);
    expect(env.wallBand).toBe(1);
    expect(env.pipes).toBe(1);
    expect(env.grate).toBeGreaterThanOrEqual(1);
    expect(env.doorImages).toBe(1);
    expect(env.machineHorizon).toBeGreaterThanOrEqual(1);
    expect(env.jungleLeak).toBe(0);

    // Walk into wave 1 and fight briefly: scene stays stable.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 370 }));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { enemyCount?: number } | null | undefined;
      return (r?.enemyCount ?? 0) >= 2;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));

    expect(pageErrors).toEqual([]);
  });
});
