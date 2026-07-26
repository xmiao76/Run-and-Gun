import { expect, test } from '@playwright/test';

interface PolishRuntime {
  level?: string;
  lives?: number;
  playerX?: number;
  grounded?: boolean;
  weapon?: string;
  projectileCount?: number;
  particleCount?: number;
  telegraphCount?: number;
  bossActive?: boolean;
  bossState?: string;
  bossPattern?: string;
  supplyCarriersAlive?: number;
  pickupsAvailable?: number;
}

async function rt(page: import('@playwright/test').Page): Promise<PolishRuntime> {
  const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
  return (state?.runtime ?? {}) as PolishRuntime;
}

async function advanceUntil(
  page: import('@playwright/test').Page,
  predicate: (r: PolishRuntime) => boolean,
  maxChunks = 80
): Promise<PolishRuntime> {
  for (let i = 0; i < maxChunks; i++) {
    const r = await rt(page);
    if (predicate(r)) {
      return r;
    }
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 30));
  }
  return rt(page);
}

test.describe('classic-feel polish pass', () => {
  test('holding fire auto-fires at exactly the weapon rate, never faster (C5)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Edge-only behavior would leave zero live bullets after 2s (ttl 1.4s).
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 120));
    const r = await rt(page);
    expect(r.projectileCount ?? 0).toBeGreaterThanOrEqual(2);
    // Pulse: 1.4s ttl / 0.22s cooldown => never more than ~7 live bullets.
    expect(r.projectileCount ?? 0).toBeLessThanOrEqual(8);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));

    expect(pageErrors).toEqual([]);
  });

  test('muzzle and death particles spawn and expire deterministically', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Muzzle flash on fire, expired shortly after. Input and stepping are
    // driven in the same evaluate so real-time frames can't slip extra sim
    // steps between them (the muzzle ttl is only ~5 steps).
    await page.evaluate(() => {
      window.__GAME_DEBUG__?.input('firePress');
      window.__GAME_DEBUG__?.command('advanceSteps', 2);
    });
    expect((await rt(page)).particleCount ?? 0).toBeGreaterThan(0);
    await page.evaluate(() => {
      window.__GAME_DEBUG__?.input('fireRelease');
      window.__GAME_DEBUG__?.command('advanceSteps', 60);
    });
    expect((await rt(page)).particleCount ?? 0).toBe(0);

    // Death burst + respawn beacon on a pit death.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => (window.__GAME_DEBUG__?.getState()?.runtime?.lives as number) === 2);
    const after = await rt(page);
    expect(after.lives).toBe(2);
    expect(after.particleCount ?? 0).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
  });

  test('enemy telegraphs engage, and the boss stomp zone damages a grounded player (E2/G1)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    // Wave-1 runner engages the player and winds up a telegraphed shot
    // (teleporting into the trigger region so the wave actually spawns).
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 530 }));
    const engaged = await advanceUntil(page, (r) => (r.telegraphCount ?? 0) >= 1, 40);
    expect(engaged.telegraphCount ?? 0).toBeGreaterThanOrEqual(1);

    // Enter the arena, then step into the stomp zone while grounded.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
    await advanceUntil(page, (r) => r.bossActive === true, 10);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2700 }));
    const resolved = await advanceUntil(page, (r) => r.bossPattern === 'stomp' && r.bossState === 'attack', 60);
    expect(resolved.bossPattern).toBe('stomp');
    const after = await advanceUntil(page, (r) => (r.lives ?? 3) < 3, 10);
    expect(after.lives ?? 3).toBeLessThan(3);

    expect(pageErrors).toEqual([]);
  });

  test('a supply skiff drops its weapon when destroyed and the player can collect it (D2)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const placedPickups = (await rt(page)).pickupsAvailable ?? 0;

    // Stand under the skiff lane and auto-fire straight up until it is destroyed.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 300 }));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdAimUp'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('firePress'));
    const destroyed = await advanceUntil(page, (r) => (r.supplyCarriersAlive ?? 1) === 0, 60);
    expect(destroyed.supplyCarriersAlive).toBe(0);
    await page.evaluate(() => window.__GAME_DEBUG__?.input('fireRelease'));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseAimUp'));

    // The drop falls and becomes a collectible pickup (+1 over placed pickups).
    const landed = await advanceUntil(page, (r) => (r.pickupsAvailable ?? 0) > placedPickups, 60);
    expect(landed.pickupsAvailable ?? 0).toBe(placedPickups + 1);

    // Walk left through the drop site (between the drop and the placed
    // scatter) and collect it: weapon switches to rapid and stays rapid.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 345 }));
    await page.evaluate(() => window.__GAME_DEBUG__?.input('holdLeft'));
    const collected = await advanceUntil(page, (r) => r.weapon === 'rapid', 40);
    expect(collected.weapon).toBe('rapid');
    await page.evaluate(() => window.__GAME_DEBUG__?.input('releaseLeft'));

    expect(pageErrors).toEqual([]);
  });
});
