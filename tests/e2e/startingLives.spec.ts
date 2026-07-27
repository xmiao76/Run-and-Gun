import { expect, test } from '@playwright/test';

import { DEFAULT_SETTINGS } from '../../src/persistence/schema';

type Page = import('@playwright/test').Page;

function runtime(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => (window.__GAME_DEBUG__?.getState()?.runtime ?? {}) as Record<string, unknown>);
}

/** Press L until the settings screen shows the requested starting-lives value. */
async function selectStartingLives(page: Page, target: number): Promise<void> {
  for (let i = 0; i < 8; i++) {
    const current = (await runtime(page)).startingLives;
    if (current === target) {
      return;
    }
    await page.keyboard.press('l');
    await page.waitForTimeout(60);
  }
  throw new Error(`could not reach ${target} starting lives`);
}

/** Count the visible life icons and read the multiplier label, if any. */
function lifeHud(page: Page): Promise<{ icons: number; label: string }> {
  return page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    const out = { icons: 0, label: '' };
    if (!scene) {
      return out;
    }
    for (const c of scene.children.list) {
      const o = c as unknown as { type: string; visible: boolean; texture?: { key?: string }; text?: string };
      if (!o.visible) {
        continue;
      }
      if (o.type === 'Image' && o.texture?.key === 'art/ui-life') {
        out.icons += 1;
      }
      if (o.type === 'Text' && typeof o.text === 'string' && /^x\d+$/.test(o.text)) {
        out.label = o.text;
      }
    }
    return out;
  });
}

/**
 * Selectable starting lives (TASK-014): choose the count in settings, have it
 * persist, have a new run honour it, and keep the HUD readable at 30.
 */
test.describe('starting lives setting', () => {
  test('defaults to 30 lives, collapsing the HUD to an icon plus a count', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    expect(DEFAULT_SETTINGS.startingLives).toBe(30);
    expect((await runtime(page)).lives).toBe(30);
    const hud = await lifeHud(page);
    expect(hud.label).toBe('x30');
    expect(hud.icons).toBe(1); // not 30 icons across the screen

    // A death decrements from 30, not from the old default of 3.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.lives === 29);
    expect((await lifeHud(page)).label).toBe('x29');

    expect(pageErrors).toEqual([]);
  });

  test('selecting the 3-life arcade run persists across a reload and is honoured', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Title -> settings, then cycle away from the 30 default down to 3 with L.
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('s');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'settings');
    expect((await runtime(page)).startingLives).toBe(30);
    await selectStartingLives(page, 3);

    // Persisted: survives a full reload.
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('s');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'settings');
    expect((await runtime(page)).startingLives).toBe(3);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    // A new run honours it, with one icon per life and no multiplier label.
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    expect((await runtime(page)).lives).toBe(3);
    expect(await lifeHud(page)).toEqual({ icons: 3, label: '' });

    // And a death decrements from the selected 3.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.lives === 2);
    expect(await lifeHud(page)).toEqual({ icons: 2, label: '' });

    expect(pageErrors).toEqual([]);
  });

  test('a corrupt stored value falls back to the default', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => {
      window.localStorage.setItem(
        'operation-iron-echo:settings:v1',
        JSON.stringify({ version: 1, startingLives: 999 })
      );
    });
    await page.reload();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    expect((await runtime(page)).lives).toBe(DEFAULT_SETTINGS.startingLives);

    expect(pageErrors).toEqual([]);
  });
});
