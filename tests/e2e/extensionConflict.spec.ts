import { expect, test } from '@playwright/test';

type Page = import('@playwright/test').Page;

/**
 * Resilience against extensions that claim bare letter keys.
 *
 * A real report: the "Global Speed" video-speed extension in Edge swallowed S
 * and X. That family of extensions binds S/D/Z/X, colliding with crouch, right,
 * jump and fire. They work by listening on `document` and stopping the event, so
 * the game listens in the capture phase on `window` - which runs before any
 * document-level listener - and keeps working.
 */
async function startLevel(page: Page): Promise<void> {
  await page.goto('/?debug=1&renderer=canvas');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
}

/** Mimic a video-speed extension: claim S/D/Z/X on document and stop them dead. */
async function installKeyStealingExtension(page: Page): Promise<void> {
  await page.evaluate(() => {
    const claimed = new Set(['KeyS', 'KeyD', 'KeyZ', 'KeyX']);
    const steal = (e: KeyboardEvent): void => {
      if (claimed.has(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        (window as unknown as { __stolen: number }).__stolen =
          ((window as unknown as { __stolen?: number }).__stolen ?? 0) + 1;
      }
    };
    // Both phases at document level, which is how such extensions hook in.
    document.addEventListener('keydown', steal, true);
    document.addEventListener('keydown', steal, false);
  });
}

test.describe('extension that steals letter keys', () => {
  test('jump and fire still work while an extension claims Z/X at document level', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await startLevel(page);
    await installKeyStealingExtension(page);

    // X fires despite the interception.
    await page.keyboard.down('x');
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 1;
    }, null, { timeout: 5_000 });
    await page.keyboard.up('x');

    // Z jumps despite the interception.
    await page.keyboard.down('z');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === false, null, {
      timeout: 5_000
    });
    await page.keyboard.up('z');

    // Confirm the simulated extension really did run and try to eat the keys.
    const stolen = await page.evaluate(() => (window as unknown as { __stolen?: number }).__stolen ?? 0);
    expect(stolen).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
  });

  test('crouch still works while an extension claims S', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await startLevel(page);
    await installKeyStealingExtension(page);

    await page.keyboard.down('s');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.crouching === true, null, {
      timeout: 5_000
    });
    await page.keyboard.up('s');

    expect(pageErrors).toEqual([]);
  });
});
