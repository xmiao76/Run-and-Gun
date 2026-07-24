import { expect, test } from '@playwright/test';

interface HardeningRuntime {
  level?: string;
  playerX?: number;
  containersAlive?: number;
  score?: number;
  scene?: string;
  musicVolume?: number;
}

async function rt(page: import('@playwright/test').Page): Promise<HardeningRuntime> {
  const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
  return { scene: state?.scene ?? undefined, ...(state?.runtime ?? {}) } as HardeningRuntime;
}

const SETTINGS_KEY = 'operation-iron-echo:settings:v1';

test.describe('M7 destructible containers (F5)', () => {
  test('a container blocks the player until destroyed, then lets them pass', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    expect((await rt(page)).containersAlive).toBe(2);

    // Stand just left of the first crate and try to walk through it: blocked.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 940 }));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForTimeout(500);
    const blockedX = (await rt(page)).playerX ?? 0;
    expect(blockedX).toBeLessThan(1000);

    // Shoot the crate until it is destroyed (3 hits, respecting the cooldown).
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
      await page.waitForTimeout(280);
      await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
      const alive = (await rt(page)).containersAlive ?? 2;
      if (alive === 1) {
        break;
      }
    }
    expect((await rt(page)).containersAlive).toBe(1);
    expect((await rt(page)).score ?? 0).toBeGreaterThanOrEqual(50);

    // The player can now walk through the space the crate occupied.
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { playerX?: number } | null | undefined;
      return (r?.playerX ?? 0) > 1030;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));

    expect(pageErrors).toEqual([]);
  });
});

test.describe('M7 settings screen (GAME_REQUIREMENTS section 11)', () => {
  test('adjusting a setting on the settings screen persists across a reload', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    await page.keyboard.press('s');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'settings');
    const before = (await rt(page)).musicVolume ?? 0;

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    const after = (await rt(page)).musicVolume ?? 0;
    expect(after).toBeCloseTo(Math.min(1, before + 0.1), 5);

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    const stored = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as { musicVolume: number }).musicVolume : null;
    }, SETTINGS_KEY);
    expect(stored).toBeCloseTo(after, 5);

    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    const reloaded = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as { musicVolume: number }).musicVolume : null;
    }, SETTINGS_KEY);
    expect(reloaded).toBeCloseTo(after, 5);

    expect(pageErrors).toEqual([]);
  });
});
