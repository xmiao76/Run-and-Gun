import { expect, test } from '@playwright/test';

interface SandboxRuntime {
  playerX: number;
  playerY: number;
  grounded: boolean;
  lives: number;
  invuln: boolean;
  invulnRemaining: number;
  weapon: string;
  projectileCount: number;
  checkpoint: string;
  score: number;
  gameOver: boolean;
}

async function runtime(page: import('@playwright/test').Page): Promise<SandboxRuntime> {
  const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
  return state?.runtime as unknown as SandboxRuntime;
}

test.describe('M1 deterministic sandbox', () => {
  test('starts, moves, jumps, fires, takes controlled damage, and respawns at the checkpoint', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Start the sandbox via the debug bridge and wait until it has published
    // its spawn state (grounded at the checkpoint) before reading it.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startSandbox'));
    await page.waitForFunction(() => {
      const s = window.__GAME_DEBUG__?.getState();
      const r = s?.runtime as SandboxRuntime | null;
      return s?.scene === 'sandbox' && r !== null && r.grounded === true;
    });

    const initial = await runtime(page);
    expect(initial.lives).toBe(3);
    expect(initial.weapon).toBe('pulse');
    expect(initial.grounded).toBe(true);
    expect(initial.projectileCount).toBe(0);
    const startX = initial.playerX;

    // Horizontal movement via synthesized input.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdRight'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as SandboxRuntime | null;
      return r !== null && r.playerX > 120;
    });
    const moved = await runtime(page);
    expect(moved.playerX).toBeGreaterThan(startX);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseRight'));

    // Jump: leaves the ground, then lands again.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpPress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as SandboxRuntime | null;
      return r !== null && r.grounded === false;
    });
    await page.evaluate(() => window.__GAME_DEBUG__?.input('jumpRelease'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as SandboxRuntime | null;
      return r !== null && r.grounded === true;
    });

    // Firing spawns exactly one pulse projectile.
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as SandboxRuntime | null;
      return r !== null && r.projectileCount >= 1;
    });
    const afterFire = await runtime(page);
    expect(afterFire.projectileCount).toBeGreaterThanOrEqual(1);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));

    // Controlled damage decrements a life, grants invulnerability, respawns at checkpoint.
    const beforeHit = await runtime(page);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('damagePlayer'));
    const hit = await runtime(page);
    expect(hit.lives).toBe(beforeHit.lives - 1);
    expect(hit.invuln).toBe(true);
    expect(hit.playerX).toBeLessThan(700); // respawned left of the pit
    expect(hit.grounded).toBe(true);

    // A second immediate hit is blocked by invulnerability.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('damagePlayer'));
    const blocked = await runtime(page);
    expect(blocked.lives).toBe(hit.lives);

    expect(pageErrors).toEqual([]);
  });
});
