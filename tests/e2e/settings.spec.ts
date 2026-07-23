import { expect, test } from '@playwright/test';

const SETTINGS_KEY = 'operation-iron-echo:settings:v1';

interface StoredSettings {
  mute: boolean;
  bestScore: number;
  reducedFlash: boolean;
}

async function readStored(page: import('@playwright/test').Page): Promise<StoredSettings | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredSettings) : null;
  }, SETTINGS_KEY);
}

test.describe('M5 persistence (B5, I1)', () => {
  test('a changed setting survives a reload', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Toggle mute on via the pause menu and let it save (hold the key so a
    // paused frame samples it).
    await page.evaluate(() => window.__GAME_DEBUG__?.command('pause'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);
    await page.keyboard.down('m');
    await page.waitForTimeout(150);
    await page.keyboard.up('m');
    await page.waitForTimeout(100);
    const stored = await readStored(page);
    expect(stored).not.toBeNull();
    expect(stored?.mute).toBe(true);

    // Reload: the stored value survives and is re-validated on boot.
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    const afterReload = await readStored(page);
    expect(afterReload?.mute).toBe(true);

    expect(pageErrors).toEqual([]);
  });

  test('best score persists through level completion and a reload', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    await page.evaluate(() => window.__GAME_DEBUG__?.command('awardScore', 500));
    await page.evaluate(() => window.__GAME_DEBUG__?.command('completeLevel'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'results');

    const stored = await readStored(page);
    expect(stored?.bestScore).toBe(500);

    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    const afterReload = await readStored(page);
    expect(afterReload?.bestScore).toBe(500);

    expect(pageErrors).toEqual([]);
  });

  test('help lists keyboard, gamepad, and touch controls (B4)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    await page.keyboard.press('h');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'help');

    const listed = await page.evaluate(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { controlsListed?: string[] } | null | undefined;
      return r?.controlsListed ?? [];
    });
    expect(listed).toContain('keyboard');
    expect(listed).toContain('gamepad');
    expect(listed).toContain('touch');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    expect(pageErrors).toEqual([]);
  });
});
