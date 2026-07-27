import { expect, test } from '@playwright/test';

type Page = import('@playwright/test').Page;

function shakeRunning(page: Page): Promise<boolean | null> {
  return page.evaluate(() => {
    const cam = window.__GAME__?.scene.getScene('level')?.cameras?.main as
      | { shakeEffect?: { isRunning?: boolean } }
      | undefined;
    return cam?.shakeEffect?.isRunning ?? null;
  });
}

async function startLevel1(page: Page): Promise<void> {
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
}

async function setReducedFlash(page: Page, value: boolean): Promise<void> {
  await page.evaluate((v) => {
    const key = 'operation-iron-echo:settings:v1';
    const raw = window.localStorage.getItem(key);
    const s = raw ? (JSON.parse(raw) as Record<string, unknown>) : { version: 1 };
    s.reducedFlash = v;
    window.localStorage.setItem(key, JSON.stringify(s));
  }, value);
}

/**
 * Arcade-feel pass (TASK-015): combat impact must be felt, denser waves must
 * arrive, the spread must read wide - and none of it may override the
 * reduced-flash accessibility setting.
 */
test.describe('arcade feel', () => {
  test('a player death shakes the screen', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await setReducedFlash(page, false);
    await page.reload();
    await startLevel1(page);

    expect(await shakeRunning(page)).toBe(false);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => {
      const cam = window.__GAME__?.scene.getScene('level')?.cameras?.main as
        | { shakeEffect?: { isRunning?: boolean } }
        | undefined;
      return cam?.shakeEffect?.isRunning === true;
    }, null, { timeout: 5_000 });

    expect(pageErrors).toEqual([]);
  });

  test('reduced flash suppresses the shake entirely', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await setReducedFlash(page, true);
    await page.reload();
    await startLevel1(page);

    // Die, then confirm the camera never starts shaking while the death plays.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.dying === true, null, {
      timeout: 5_000
    });
    for (let i = 0; i < 5; i++) {
      expect(await shakeRunning(page)).toBe(false);
      await page.waitForTimeout(60);
    }

    await setReducedFlash(page, false);
    expect(pageErrors).toEqual([]);
  });

  test('waves field more defenders and the spread fans wide', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await startLevel1(page);

    // Wave 1 now fields three, not two.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { enemyCount?: number } | null | undefined;
      return (r?.enemyCount ?? 0) >= 3;
    }, null, { timeout: 10_000 });

    // The scatter fan spans +/-24 degrees. Real frames are needed here, because
    // advanceSteps drives the simulation without a render pass.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 360 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.weapon === 'scatter');
    await page.keyboard.down('x');
    await page.waitForFunction(
      () => {
        const scene = window.__GAME__?.scene.getScene('level');
        if (!scene) {
          return false;
        }
        const angles = scene.children.list
          .map((c) => c as unknown as { type: string; visible: boolean; texture?: { key?: string }; rotation: number })
          .filter((o) => o.type === 'Image' && o.visible && o.texture?.key === 'art/bullet-scatter')
          .map((o) => (o.rotation * 180) / Math.PI);
        // Both outer pellets present, at roughly +/-24 degrees.
        return (
          angles.some((a) => Math.abs(a + 24) < 2) &&
          angles.some((a) => Math.abs(a - 24) < 2)
        );
      },
      null,
      { timeout: 5_000 }
    );
    await page.keyboard.up('x');

    expect(pageErrors).toEqual([]);
  });
});
