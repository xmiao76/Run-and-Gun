import { expect, test } from '@playwright/test';

import { createDriver } from './helpers/gameDriver';

/**
 * TASK-020: the contract an automated driver relies on.
 *
 * The load-bearing guarantee is that `advanceSteps` stops at the transition
 * that ends a run. Phaser's `scene.start` only QUEUES the swap for the next
 * Scene Manager update, so `scene.isActive()` stays true for the rest of a
 * synchronous batch; without an explicit latch a game over re-queued
 * stop+start once per remaining step, and a completion let the level keep
 * simulating (potentially queueing a second, conflicting transition).
 */

/** Scene keys Phaser currently reports as running. */
async function activeScenes(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const game = (window as unknown as { __GAME__?: Phaser.Game }).__GAME__;
    if (!game) {
      return [];
    }
    return game.scene.getScenes(true).map((s) => s.scene.key);
  });
}

test.describe('debug bridge contract', () => {
  test('advanceSteps stops at a completion and reports it, leaving one scene running', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);
    await driver.completeLevel();

    const result = await driver.command<{ ok: boolean; steps: number; ended: string | null }>('advanceSteps', 3600);
    expect(result.ok).toBe(true);
    expect(result.ended).toBe('results');
    // The completion delay is 1.2 s = 72 steps, so the batch must stop far
    // short of the 3600 it was asked for rather than running a stopped level.
    expect(result.steps).toBeGreaterThan(0);
    expect(result.steps).toBeLessThan(3600);

    await driver.waitForScene('results');
    expect(await activeScenes(page)).toEqual(['results']);
  });

  test('advanceSteps stops at a game over too', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);
    await driver.command('triggerGameOver');

    const result = await driver.command<{ steps: number; ended: string | null }>('advanceSteps', 3600);
    expect(result.ended).toBe('gameOver');
    expect(result.steps).toBeLessThan(3600);

    await driver.waitForScene('gameOver');
    expect(await activeScenes(page)).toEqual(['gameOver']);
  });

  test('a stopped level no longer answers gameplay commands', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);
    await driver.command('triggerGameOver');
    await driver.command('advanceSteps', 120);
    await driver.waitForScene('gameOver');

    // Previously the registry kept the dead level's handlers, so this silently
    // mutated a scene that was on its way out.
    const teleport = await driver.command<{ ok: boolean; error?: string }>('teleportPlayer', { x: 500 });
    expect(teleport.ok).toBe(false);
    expect(teleport.error).toContain('teleportPlayer');
  });

  test('confirmMenu leaves the results screen with no key press and no wall-clock wait', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);
    await driver.completeLevel();
    await driver.command('advanceSteps', 600);
    await driver.waitForScene('results');

    const confirmed = await driver.command<{ ok: boolean }>('confirmMenu');
    expect(confirmed.ok).toBe(true);

    const snapshot = await driver.waitForScene('level');
    const runtime = snapshot.runtime as { levelIndex?: number };
    expect(runtime.levelIndex).toBe(1);
  });

  test('backMenu takes the game-over screen to the title', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);
    await driver.command('triggerGameOver');
    await driver.command('advanceSteps', 120);
    await driver.waitForScene('gameOver');

    expect((await driver.command<{ ok: boolean }>('backMenu')).ok).toBe(true);
    await driver.waitForScene('title');
  });

  test('crouch and drop are drivable from the bridge', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);

    await driver.input('holdCrouch');
    let snapshot = await driver.step(4);
    expect((snapshot.runtime as { crouching?: boolean }).crouching).toBe(true);
    await driver.input('releaseCrouch');

    // Land on the one-way platform that bridges the first pit (x 720-840,
    // deck at y 408), then drop through it into the pit below.
    await driver.teleport(760, 400);
    snapshot = await driver.step(30);
    const onPlatform = snapshot.runtime as { grounded?: boolean; playerY?: number };
    expect(onPlatform.grounded).toBe(true);
    const deckY = onPlatform.playerY ?? 0;

    await driver.input('holdDrop');
    snapshot = await driver.step(20);
    await driver.input('releaseDrop');
    expect((snapshot.runtime as { playerY?: number }).playerY ?? 0).toBeGreaterThan(deckY);
  });

  test('deaths are published with a cause and a position', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);

    // Drop into the first pit and let the death pause run. The drop has to
    // start BELOW the one-way deck at y 408 that bridges the gap, otherwise the
    // player simply lands on it.
    await driver.teleport(780, 800);
    const snapshot = await driver.step(240);
    const deaths = (snapshot.runtime as { deaths?: Array<{ cause: string; x: number; costLife: boolean }> }).deaths ?? [];
    expect(deaths.length).toBeGreaterThan(0);
    expect(deaths[0].cause).toBe('pit');
    expect(deaths[0].x).toBeGreaterThan(700);
    expect(deaths[0].costLife).toBe(true);
  });

  test('a floor hazard death is attributed to the spike strip, not to the pit', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(2);

    // Level 2 carries a spike strip at x 2360-2430, just past the preboss
    // checkpoint at x 2240. Walking into it must read as `hazard`; `pit` is the
    // fall-below-the-world case and the two share one call site.
    await driver.command('startAtCheckpoint', { id: 'preboss' });
    await driver.hold('right');
    const snapshot = await driver.step(150);
    await driver.release('right');

    const deaths = (snapshot.runtime as { deaths?: Array<{ cause: string; x: number }> }).deaths ?? [];
    expect(deaths.length).toBeGreaterThan(0);
    expect(deaths[0].cause).toBe('hazard');
    expect(deaths[0].x).toBeGreaterThan(2300);
  });

  test('a boss stomp death is attributed to the shockwave', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);

    await driver.command('startAtCheckpoint', { id: 'preboss', lives: 30 });
    // Walk in so the boss activates honestly, then stand still in the arena.
    // The shockwave only damages a grounded player, which is why the AI pilot
    // (which jumps every stomp telegraph) never produces this cause.
    await driver.hold('right');
    await driver.step(200);
    await driver.release('right');
    await driver.teleport(2700);

    const snapshot = await driver.step(3000);
    const deaths = (snapshot.runtime as { deaths?: Array<{ cause: string }> }).deaths ?? [];
    expect(deaths.some((d) => d.cause === 'bossShockwave')).toBe(true);
  });

  test('startAtCheckpoint starts a segment with the triggers ahead of it still armed', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);

    const started = await driver.command<{ ok: boolean; checkpoint: string; lives: number }>('startAtCheckpoint', {
      id: 'mid',
      lives: 3
    });
    expect(started.ok).toBe(true);
    expect(started.checkpoint).toBe('mid');
    expect(started.lives).toBe(3);

    const atStart = await driver.command<unknown>('report');
    expect(atStart).toBeTruthy();
    let snapshot = await driver.snapshot();
    expect((snapshot.runtime as { playerX?: number }).playerX).toBeCloseTo(1180, 0);
    expect((snapshot.runtime as { lives?: number }).lives).toBe(3);
    expect((snapshot.runtime as { enemyCount?: number }).enemyCount).toBe(0);

    // Spawn triggers fire when playerX enters their band, so a teleport across
    // a band skips its wave forever. Restarting at `start` must leave wave 1
    // (x 520-560) armed: walking into it still spawns.
    await driver.command('startAtCheckpoint', { id: 'start' });
    await driver.hold('right');
    snapshot = await driver.step(160);
    await driver.release('right');
    const afterWave = snapshot.runtime as { playerX?: number; enemyCount?: number };
    expect(afterWave.playerX ?? 0).toBeGreaterThan(560);
    expect(afterWave.enemyCount ?? 0).toBeGreaterThan(0);
  });

  test('startAtCheckpoint can start the boss segment directly', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await driver.goto();
    await driver.startLevel(1);

    await driver.command('startAtCheckpoint', { id: 'preboss' });
    await driver.hold('right');
    const snapshot = await driver.step(200);
    await driver.release('right');
    expect((snapshot.runtime as { bossActive?: boolean }).bossActive).toBe(true);
  });
});

/**
 * TASK-026: a pit death is never free.
 *
 * `finishDeath` used to go through `applyDamage`, which is blocked while a
 * mercy-invulnerability window is open - but the respawn ran regardless. The
 * everyday way to hit it: die, respawn (which opens a fresh window), then walk
 * straight off the same ledge again. The second fall cost nothing.
 *
 * Deterministic by construction: the invulnerability clock does not tick during
 * the death pause, so the window from the first respawn is still open when the
 * second death resolves.
 */
test('a pit death during the invulnerability window still costs a life', async ({ page }) => {
  const driver = createDriver(page, { manualClock: true });
  await driver.goto();
  await driver.startLevel(1);
  await driver.command('startAtCheckpoint', { id: 'start', lives: 30 });

  /** Fall into the first pit and stop as soon as the life is actually lost. */
  async function fallIntoPitAndSettle(expectedLives: number): Promise<{ lives: number; invuln: boolean }> {
    await driver.teleport(780, 800);
    for (let i = 0; i < 20; i++) {
      const snap = await driver.step(10);
      const rt = snap.runtime as { lives?: number; invuln?: boolean };
      if ((rt.lives ?? 0) === expectedLives) {
        return { lives: rt.lives ?? 0, invuln: Boolean(rt.invuln) };
      }
    }
    throw new Error(`player never dropped to ${expectedLives} lives`);
  }

  // First death. Stopping as soon as it resolves matters: the mercy window is
  // only 1.5 s, so over-stepping here would let it expire and quietly turn this
  // into an ordinary second death that proves nothing.
  const first = await fallIntoPitAndSettle(29);
  expect(first.invuln).toBe(true);

  // Second death, with that window still open.
  const second = await fallIntoPitAndSettle(28);
  expect(second.lives).toBe(28);

  const snapshot = await driver.snapshot();
  const deaths = (snapshot.runtime as { deaths?: Array<{ costLife: boolean }> }).deaths ?? [];
  expect(deaths).toHaveLength(2);
  // The published death log agrees with the lives actually lost.
  expect(deaths.every((d) => d.costLife)).toBe(true);
});

/**
 * TASK-027: walking off a ledge is a `pit` death, not a `hazard` death.
 *
 * Level 1's pits are painted with hazard-striped markers inside the void, and
 * the scene used to treat every rect in `hazards` as lethal on contact. The
 * player therefore died on the paint a few frames before reaching the fall
 * threshold, and the cause came out as `hazard`.
 */
test('walking into a Level 1 pit is attributed to the pit, not to its paint', async ({ page }) => {
  const driver = createDriver(page, { manualClock: true });
  await driver.goto();
  await driver.startLevel(1);
  await driver.command('startAtCheckpoint', { id: 'start', lives: 30 });

  // Stand just short of the first pit (gap at x 720-840). Placing the player
  // here also keeps the wave-1 trigger at x 520-560 behind us, so enemy fire
  // cannot claim the first death and mask what the fall is attributed to.
  await driver.teleport(690, 480);
  await driver.step(4);

  // Walk off the edge on foot - no teleport into the void, so the player falls
  // through the marker band the way a real player does.
  await driver.hold('right');
  let deaths: Array<{ cause: string; x: number }> = [];
  for (let i = 0; i < 40 && deaths.length === 0; i++) {
    const snapshot = await driver.step(20);
    deaths = (snapshot.runtime as { deaths?: Array<{ cause: string; x: number }> }).deaths ?? [];
  }
  await driver.release('right');

  expect(deaths.length).toBeGreaterThan(0);
  expect(deaths[0].cause).toBe('pit');
  expect(deaths[0].x).toBeGreaterThan(700);
});
