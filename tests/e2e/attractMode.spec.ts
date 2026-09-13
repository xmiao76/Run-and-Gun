import { expect, test } from '@playwright/test';

import { createDriver } from './helpers/gameDriver';

/**
 * TASK-033: the title screen's attract demo.
 *
 * An arcade cabinet plays itself when nobody is standing at it; a machine
 * driving the game must never see that happen. Both halves are covered here,
 * driven through the `?attractMs` seam (see src/ui/attract.ts for the rule).
 */

test.describe('attract mode', () => {
  test('a real visitor gets the demo after the idle delay', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    // attractMs forces the demo on with a short delay even under ?debug, which
    // is exactly the seam intended for this test.
    const driver = createDriver(page, { manualClock: true });
    await page.goto('/?debug=1&manualClock=1&renderer=canvas&attractMs=400');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Idle past the delay (real time; the title screen's update loop is what
    // counts it, and it runs under the manual clock).
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'level', undefined, {
      timeout: 10_000
    });

    // The pilot is driving, with the demo label on the display list.
    const state = await driver.snapshot();
    expect((state.runtime as { autopilot?: boolean }).autopilot).toBe(true);
    const demoLabel = await page.evaluate(() => {
      const game = (window as unknown as { __GAME__?: Phaser.Game }).__GAME__;
      const scene = game?.scene.getScene('level');
      return scene?.children.list.some(
        (o) => (o.type === 'Text' || o.type === 'BitmapText') && String((o as Phaser.GameObjects.Text).text).includes('DEMO')
      );
    });
    expect(demoLabel).toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test('any key during the demo returns to the title', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await page.goto('/?debug=1&manualClock=1&renderer=canvas&attractMs=300');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'level', undefined, {
      timeout: 10_000
    });

    await driver.step(60);
    // Under the manual clock a key is only seen while a step runs, so the
    // press has to span one: press-then-release between two steps reads as
    // neutral input and the demo would not notice the takeover.
    await page.keyboard.down('x');
    await driver.step(5);
    await page.keyboard.up('x');
    await driver.waitForScene('title');

    // The demo cleaned up after itself: a normal start is now a human game.
    const state = await driver.snapshot();
    expect(state.scene).toBe('title');
  });

  test('the demo never writes the pilot score as the best score', async ({ page }) => {
    const driver = createDriver(page, { manualClock: true });
    await page.goto('/?debug=1&manualClock=1&renderer=canvas&attractMs=300');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'level', undefined, {
      timeout: 10_000
    });

    // The pilot completes Level 1 in ~1,450 steps; fast-forward well past it.
    let scene = 'level';
    for (let i = 0; i < 8 && scene === 'level'; i++) {
      const snapshot = await driver.step(600);
      scene = snapshot.scene ?? 'level';
    }
    expect(scene).toBe('results');

    // The results screen shows a positive pilot score but must NOT persist it.
    const results = await driver.snapshot();
    expect((results.runtime as { score?: number }).score ?? 0).toBeGreaterThan(0);

    const stored = await page.evaluate(() => window.localStorage.getItem('operation-iron-echo:settings:v1') ?? '{}');
    expect(JSON.parse(stored).bestScore ?? 0).toBe(0);

    // And the demo loops back to the title rather than into Level 2.
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title', undefined, {
      timeout: 10_000
    });
    expect((await driver.snapshot()).scene).toBe('title');
  });

  test('the idle timer stays off under automation without the attractMs override', async ({ page }) => {
    // ?debug with no attractMs: the arming rule suppresses the demo entirely,
    // so no amount of idling on the title starts a level.
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1_500);
    expect((await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.scene)) ?? '').toBe('title');
    expect(pageErrors).toEqual([]);
  });
});
