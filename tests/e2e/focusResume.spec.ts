import { expect, test } from '@playwright/test';

type Page = import('@playwright/test').Page;

interface FocusRuntime {
  paused?: boolean;
  autoPaused?: boolean;
  projectileCount?: number;
  playerX?: number;
}

function rt(page: Page): Promise<FocusRuntime> {
  return page.evaluate(() => (window.__GAME_DEBUG__?.getState()?.runtime ?? {}) as FocusRuntime);
}

async function startLevel(page: Page): Promise<void> {
  await page.goto('/?debug=1&renderer=canvas');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
}

/**
 * Focus-loss recovery. Browsers steal window focus for their own UI (Edge is
 * especially eager: sidebar, password bubbles, notification toasts). Losing
 * focus auto-pauses the game, and before this was fixed the only way back was
 * Esc - so the game looked permanently unresponsive: pressing fire did nothing.
 */
test.describe('recovery after the browser steals focus', () => {
  test('a stolen focus auto-pauses, and clicking the game resumes it so firing works again', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await startLevel(page);

    // Fire works to begin with.
    await page.keyboard.down('x');
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 1;
    });
    await page.keyboard.up('x');

    // The browser takes focus (sidebar, popup, toast...).
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);
    const paused = await rt(page);
    expect(paused.paused).toBe(true);
    expect(paused.autoPaused).toBe(true);

    // Clicking the game resumes it - no hidden Esc required.
    await page.mouse.click(480, 270);
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === false);
    const resumed = await rt(page);
    expect(resumed.autoPaused).toBe(false);

    // And fire responds again, which is the symptom that was reported.
    const before = (await rt(page)).projectileCount ?? 0;
    await page.keyboard.down('x');
    await page.waitForFunction(
      (n) => {
        const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
        return (r?.projectileCount ?? 0) > n;
      },
      before,
      { timeout: 5_000 }
    );
    await page.keyboard.up('x');

    expect(pageErrors).toEqual([]);
  });

  test('regaining window focus alone also resumes', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await startLevel(page);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.autoPaused === true);

    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === false);

    expect(pageErrors).toEqual([]);
  });

  test('a deliberate Esc pause is NOT dismissed by clicking', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await startLevel(page);

    // Player pauses on purpose.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);
    expect((await rt(page)).autoPaused).toBe(false);

    // Clicking must not steal the decision back from the player.
    await page.mouse.click(480, 270);
    await page.waitForTimeout(300);
    expect((await rt(page)).paused).toBe(true);

    // Esc still resumes.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === false);

    expect(pageErrors).toEqual([]);
  });
});
