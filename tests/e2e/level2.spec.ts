import { expect, test } from '@playwright/test';

import { DEFAULT_SETTINGS } from '../../src/persistence/schema';

interface LevelRuntime {
  scene?: string;
  level?: string;
  levelIndex?: number;
  playerX?: number;
  playerY?: number;
  grounded?: boolean;
  lives?: number;
  invuln?: boolean;
  checkpoint?: string;
  paused?: boolean;
  completing?: boolean;
  gameOver?: boolean;
  bossActive?: boolean;
  bossState?: string;
  bossPhase?: number;
  subcomponentsAlive?: number;
  score?: number;
  final?: boolean;
}

async function rt(page: import('@playwright/test').Page): Promise<LevelRuntime> {
  const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
  return { scene: state?.scene ?? undefined, ...(state?.runtime ?? {}) } as LevelRuntime;
}

test.describe('M4 checkpoints and game-over flow', () => {
  test('a pit death respawns the player at the last checkpoint with invulnerability', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Drop the player into the first pit: below the death-fall threshold.
    // Asserted as one life lost, not an absolute count, so the configured
    // default is irrelevant to this test.
    const livesAtStart = (await rt(page)).lives as number;
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction((n) => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      return r !== null && r !== undefined && (r.lives as number) === n - 1;
    }, livesAtStart);

    const after = await rt(page);
    expect(after.lives).toBe(livesAtStart - 1);
    expect(after.invuln).toBe(true);
    expect(after.checkpoint).toBe('start');
    expect(after.playerX).toBe(60);
    expect(after.grounded).toBe(true);

    expect(pageErrors).toEqual([]);
  });

  test('game over offers restart-level and return-to-title without stale state', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Force the game-over screen, then restart the level with R.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('triggerGameOver'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'gameOver');
    await page.keyboard.press('r');
    await page.waitForFunction((n) => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime;
      return r?.level === 'jungle-outpost' && (r.lives as number) === n;
    }, DEFAULT_SETTINGS.startingLives);
    expect((await rt(page)).gameOver).toBe(false);

    // Force it again, then return to the title with T.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('triggerGameOver'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'gameOver');
    await page.keyboard.press('t');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    expect(pageErrors).toEqual([]);
  });
});

test.describe('M4 Level 2 and final flow', () => {
  test('Level 1 completes into Level 2, and Level 2 completes into the final screen', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Complete Level 1 -> results (not final) -> Enter advances to Level 2.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('completeLevel'));
    await page.waitForFunction(() => {
      const s = window.__GAME_DEBUG__?.getState();
      return s?.scene === 'results' && (s.runtime as { final?: boolean } | null)?.final === false;
    });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'fortress-interior');

    const l2 = await rt(page);
    expect(l2.level).toBe('fortress-interior');
    expect(l2.lives).toBe(DEFAULT_SETTINGS.startingLives);

    // Activate the Reactor Warden, defeat it, and complete the level.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
    expect((await rt(page)).subcomponentsAlive).toBe(2);

    await page.evaluate(() => window.__GAME_DEBUG__?.command('defeatBoss'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossState === 'dead');

    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 3180 }));
    await page.waitForFunction(() => {
      const s = window.__GAME_DEBUG__?.getState();
      return s?.scene === 'results' && (s.runtime as { final?: boolean } | null)?.final === true;
    });

    // Final completion returns to the title.
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    expect(pageErrors).toEqual([]);
  });
});
