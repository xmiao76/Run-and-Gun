import { expect, test } from '@playwright/test';
import { GameDriver } from './helpers/gameDriver';
import type { LevelRuntime } from '../../src/debug/runtimeTypes';

/**
 * Exercises the shared GameDriver end to end on Level 1 under the manual
 * clock: every movement, shot, and transition happens through typed state
 * reads and deterministic steps - no screenshots, no real-time waits.
 */

const levelRuntime = (snapshot: { runtime: unknown }): LevelRuntime => snapshot.runtime as LevelRuntime;

test.describe('GameDriver smoke', () => {
  test('drives level 1 from spawn to boss defeat deterministically', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    const driver = new GameDriver(page, { manualClock: true, renderer: 'canvas' });
    const ready = await driver.goto();
    expect(ready.gameTitle).toBe('Operation Iron Echo');
    expect(ready.scene).toBe('title');

    const start = await driver.startLevel(1);
    expect(start.level).toBe('jungle-outpost');
    expect(start.manualClock).toBe(true);
    const startX = start.playerX;

    // Run right for half a second of simulation time.
    const ran = levelRuntime(await driver.act({ hold: ['right'] }, 30));
    expect(ran.playerX - startX).toBeGreaterThan(50);

    // Fire while running: a pulse bolt is in flight.
    const fired = levelRuntime(await driver.act({ tap: ['fire'] }, 2));
    expect(fired.projectileCount).toBeGreaterThanOrEqual(1);
    expect(fired.fireAngle).toBe(0);

    // Release and jump: airborne after the step, landed shortly after.
    const jumped = levelRuntime(await driver.act({ release: ['right'], tap: ['jump'] }, 2));
    expect(jumped.grounded).toBe(false);
    const landed = levelRuntime(await driver.act({ release: ['jump'] }, 60));
    expect(landed.grounded).toBe(true);

    // Teleport into the boss arena; stepping activates the Siege Walker.
    await driver.teleport(2600);
    const boss = levelRuntime(await driver.act({}, 5));
    expect(boss.bossActive).toBe(true);
    expect(boss.bossHealth).toBeGreaterThan(0);

    // Defeat the boss, force completion, step past COMPLETION_DELAY (72
    // steps): the results screen follows.
    await driver.defeatBoss();
    await driver.completeLevel();
    await driver.step(180);
    const results = await driver.waitForScene('results', 5_000);
    expect(results.scene).toBe('results');

    await driver.gotoTitle();
    expect(pageErrors).toEqual([]);
  });
});
