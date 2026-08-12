import { expect, test } from '@playwright/test';

/**
 * AI autoplay demo (TASK-018): the built-in pilot plays Level 1 through the
 * same typed runtime state and InputState merge that tests and external
 * agents use - no screenshots, no debug cheats. Driven under the manual
 * clock, so the whole run is deterministic and fast-forwardable.
 */

type AutopilotRuntime = {
  level?: string;
  playerX?: number;
  score?: number;
  bossActive?: boolean;
  bossHealth?: number;
  autopilot?: boolean;
  manualClock?: boolean;
};

const BOSS_MAX_HEALTH = 12;

test.describe('AI autoplay demo', () => {
  test.setTimeout(240_000);

  test('the pilot plays Level 1 from title to boss defeat, honestly', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    // Start the demo the way a player would: the I key on the title screen.
    await page.keyboard.press('i');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const engaged = (await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime)) as AutopilotRuntime;
    expect(engaged.autopilot).toBe(true);
    expect(engaged.manualClock).toBe(true);

    // Fast-forward the pilot in 10-simulation-second chunks; under the manual
    // clock nothing else moves the world. Track autonomous progress.
    let maxX = 0;
    let bossActivated = false;
    let bossDamaged = false;
    let scored = false;
    let completed = false;
    for (let chunk = 0; chunk < 120 && !completed; chunk++) {
      const state = await page.evaluate(() => {
        const bridge = window.__GAME_DEBUG__!;
        bridge.command('advanceSteps', 600);
        return bridge.getState();
      });
      const r = (state?.runtime ?? {}) as AutopilotRuntime;
      maxX = Math.max(maxX, r.playerX ?? 0);
      if (r.bossActive) {
        bossActivated = true;
      }
      if (r.bossActive && (r.bossHealth ?? BOSS_MAX_HEALTH) < BOSS_MAX_HEALTH) {
        bossDamaged = true;
      }
      if ((r.score ?? 0) > 0) {
        scored = true;
      }
      if (state?.scene === 'results') {
        completed = true;
        break;
      }
      if (state?.scene !== 'level') {
        break;
      }
    }

    expect(maxX).toBeGreaterThan(2500); // crossed the level, reached the arena
    expect(bossActivated).toBe(true); // Siege Walker engaged
    expect(bossDamaged).toBe(true); // honest damage, no defeatBoss cheat
    expect(scored).toBe(true); // killed enemies and/or cracked crates
    expect(completed).toBe(true); // results scene => boss defeated, exit traversed
    expect(pageErrors).toEqual([]);
  });

  test('any human control key instantly takes over from the pilot', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');
    await page.keyboard.press('i');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.autopilot === true);

    // Let the pilot walk for a simulated second, then grab a control key.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 60));
    await page.keyboard.down('ArrowLeft');
    const runtime = (await page.evaluate(() => {
      const bridge = window.__GAME_DEBUG__!;
      bridge.command('advanceSteps', 5);
      return bridge.getState()?.runtime;
    })) as AutopilotRuntime;
    await page.keyboard.up('ArrowLeft');

    expect(runtime.autopilot).toBe(false);
  });

  test('?autopilot=remote starts the level with the pilot disengaged', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas&autopilot=remote');
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    const runtime = (await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime)) as AutopilotRuntime;
    expect(runtime.autopilot).toBe(false);
  });
});
