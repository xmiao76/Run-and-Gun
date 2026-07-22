import { expect, test } from '@playwright/test';

interface LevelRuntime {
  scene?: string;
  level?: string;
  lives?: number;
  paused?: boolean;
  completing?: boolean;
  gameOver?: boolean;
  bossActive?: boolean;
  score?: number;
}

async function rt(page: import('@playwright/test').Page): Promise<LevelRuntime> {
  const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
  return (state?.runtime ?? {}) as LevelRuntime;
}

test.describe('M3 Level 1 flow', () => {
  test('loads the level, pauses/resumes, and completes to the results screen', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Start Level 1 from the title screen.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const loaded = await rt(page);
    expect(loaded.level).toBe('jungle-outpost');
    expect(loaded.lives).toBe(3);
    expect(loaded.paused).toBe(false);

    // Pause freezes the simulation; resume clears it.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('pause'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === true);
    expect((await rt(page)).paused).toBe(true);

    await page.evaluate(() => window.__GAME_DEBUG__?.command('resume'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.paused === false);
    expect((await rt(page)).paused).toBe(false);

    // Deterministic level-complete hand-off to the results screen.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('completeLevel'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'results', undefined, { timeout: 5_000 });

    const results = await rt(page);
    expect(results.scene).toBe('results');
    expect(typeof results.score).toBe('number');

    expect(pageErrors).toEqual([]);
  });
});
