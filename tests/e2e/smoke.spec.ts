import { expect, test } from '@playwright/test';

test.describe('J1 consolidated smoke test', () => {
  test('starts a game, moves, jumps, fires, pauses, resumes, and returns to title', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Real keyboard New Game start from the title screen.
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Move.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { playerX?: number } | null | undefined;
      return (r?.playerX ?? 0) > 100;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));

    // Jump and land.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpPress'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === false);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpRelease'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.grounded === true);

    // Fire.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { projectileCount?: number } | null | undefined;
      return (r?.projectileCount ?? 0) >= 1;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));

    // Pause and resume.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('pause'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('resume'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === false);

    // Return to title.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('gotoTitle'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    expect(pageErrors).toEqual([]);
  });
});
