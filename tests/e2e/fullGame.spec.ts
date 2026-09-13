import { expect, test } from '@playwright/test';

/**
 * Full game completion flow (TASK-008): title -> level 1 -> boss -> results ->
 * level 2 -> boss -> results -> level 3 -> final boss -> MISSION COMPLETE ->
 * title, driven by real key input for scene transitions.
 *
 * The `final` flag is the assertion that matters: it must be false on every
 * intermediate stage and true only on the last. Adding a stage moves where it
 * flips, which is exactly the kind of change that should break a test until
 * someone looks at it (TASK-039).
 */
test.describe('full game completion', () => {
  test('the game can be completed from title screen to ending', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Title -> Level 1 via the real Enter key.
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Reach and defeat the Siege Walker, then walk past the exit.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('defeatBoss'));
    await page.waitForFunction(() => (window.__GAME_DEBUG__?.getState()?.runtime?.bossHealth ?? 1) === 0);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 3190 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'results', null, { timeout: 10_000 });
    let results = await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);
    expect(results?.final).toBe(false);

    // Results -> Level 2 via Enter.
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');

    // Reach and defeat the Reactor Warden, then exit.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('defeatBoss'));
    await page.waitForFunction(() => (window.__GAME_DEBUG__?.getState()?.runtime?.bossHealth ?? 1) === 0);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 3190 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'results', null, { timeout: 10_000 });
    results = await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);
    // Level 2 is no longer the last stage, so this is an intermediate results
    // screen now.
    expect(results?.final).toBe(false);

    // Results -> Level 3 via Enter.
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'ashfall-ridge');

    // Reach and defeat the final boss, then exit.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2620 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('defeatBoss'));
    await page.waitForFunction(() => (window.__GAME_DEBUG__?.getState()?.runtime?.bossHealth ?? 1) === 0);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 3190 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'results', null, { timeout: 10_000 });
    results = await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);
    // MISSION COMPLETE: the final flag marks the ending screen.
    expect(results?.final).toBe(true);

    // Ending -> title via Enter.
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    expect(pageErrors).toEqual([]);
  });
});
