import { expect, test } from '@playwright/test';

type Page = import('@playwright/test').Page;

/**
 * Y positions of the in-flight player projectile sprites.
 *
 * The depth filter matters: the HUD weapon icon uses the SAME texture as the
 * bullet it represents and sits at depth 100, so without it this helper reads
 * the motionless icon at the top of the screen instead of the shot.
 */
async function bulletYs(page: Page, texture: string): Promise<number[]> {
  // `advanceSteps` moves the SIMULATION; the sprites are repositioned by the
  // scene's next render. Reading straight after advancing therefore races the
  // renderer - it happened to pass alone and failed under full-suite load, so
  // wait for a frame to actually land before looking at sprite positions.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  );
  return page.evaluate((key) => {
    const scene = window.__GAME__?.scene.getScene('level');
    if (!scene) {
      return [];
    }
    return scene.children.list
      .map((c) => c as unknown as { type: string; visible: boolean; texture?: { key?: string }; y: number; depth: number })
      .filter((o) => o.type === 'Image' && o.visible && o.texture?.key === key && o.depth < 100)
      .map((o) => o.y);
  }, texture);
}

/**
 * Set up Level 1 wave 1 with a chosen weapon and stop with two runners
 * charging in a line to the player's right - the geometry that makes piercing
 * observable rather than theoretical.
 */
async function armWaveOne(page: Page, weapon: string): Promise<void> {
  await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
  await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
  await page.evaluate((w) => window.__GAME_DEBUG__?.command('startAtCheckpoint', { id: 'start', weapon: w }), weapon);
  await page.evaluate(() => {
    const b = window.__GAME_DEBUG__;
    b?.input('holdRight');
    b?.command('advanceSteps', 370);
    b?.input('releaseRight');
  });
}

/** Hold fire for `steps`, then let the shots finish travelling. */
async function fireFor(page: Page, steps: number): Promise<void> {
  await page.evaluate((n) => {
    const b = window.__GAME_DEBUG__;
    b?.input('firePress');
    b?.command('advanceSteps', n);
    b?.input('fireRelease');
    b?.command('advanceSteps', 30);
  }, steps);
}

async function runnerKills(page: Page): Promise<number> {
  return page.evaluate(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime as { killsByKind?: Record<string, number> } | null | undefined;
    return r?.killsByKind?.runner ?? 0;
  });
}

/**
 * TASK-036: the Lance Laser and the Flare Thrower.
 *
 * The unit tests pin the weapon DATA; these pin the behaviour that only exists
 * once the collision resolver runs - that a piercing shot passes through more
 * than one target, and that it still cannot damage one target twice.
 */
test.describe('weapon roster', () => {
  test('the laser passes through a line of enemies; a non-piercing shot does not', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    // Identical scenario, identical firing window, two weapons. The laser
    // fires SLOWER than the pulse rifle (0.3s vs 0.22s cooldown), so it gets
    // strictly fewer shots off - any extra kills can only come from piercing.
    await armWaveOne(page, 'pulse');
    await fireFor(page, 40);
    const pulseKills = await runnerKills(page);

    await armWaveOne(page, 'laser');
    await fireFor(page, 40);
    const laserKills = await runnerKills(page);

    expect(pulseKills).toBe(1);
    expect(laserKills).toBe(2);
    expect(pageErrors).toEqual([]);
  });

  test('a single piercing shot damages a target only once, however long it overlaps', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await armWaveOne(page, 'laser');

    // Exactly one shot. A runner has 2 health and the laser deals 1, so one
    // shot must NOT kill it.
    //
    // This is the regression guard for the subtle half of piercing: the damage
    // ledger is cleared every step, and a piercing shot outlives its first hit,
    // so it is still overlapping that runner on the following steps. Without
    // the projectile's own lifetime hit list it would re-damage the same runner
    // each step and kill it outright - piercing must let a shot hit MORE
    // targets, never the same target more often.
    await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.input('firePress');
      b?.command('advanceSteps', 1);
      b?.input('fireRelease');
      b?.command('advanceSteps', 45);
    });

    expect(await runnerKills(page)).toBe(0);
  });

  test('the flame shot arcs downward while a rifle shot flies flat', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startAtCheckpoint', { id: 'start', weapon: 'flame' }));

    await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.input('firePress');
      b?.command('advanceSteps', 1);
      b?.input('fireRelease');
    });
    const firstY = (await bulletYs(page, 'art/bullet-flame'))[0];
    expect(firstY).toBeDefined();

    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 25));
    const laterY = (await bulletYs(page, 'art/bullet-flame'))[0];
    expect(laterY).toBeDefined();
    // Screen y grows downward: the ember has fallen.
    expect(laterY).toBeGreaterThan(firstY);

    // The same test against the pulse rifle, which must still fly dead flat.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startAtCheckpoint', { id: 'start', weapon: 'pulse' }));
    await page.evaluate(() => {
      const b = window.__GAME_DEBUG__;
      b?.input('firePress');
      b?.command('advanceSteps', 1);
      b?.input('fireRelease');
    });
    const pulseStart = (await bulletYs(page, 'art/bullet-pulse'))[0];
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 25));
    const pulseLater = (await bulletYs(page, 'art/bullet-pulse'))[0];
    expect(pulseLater).toBe(pulseStart);
  });

  test('the HUD shows the capsule letter for the weapon in hand', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    const hudWeaponText = async (): Promise<string> =>
      page.evaluate(() => {
        const scene = window.__GAME__?.scene.getScene('level');
        const labels = (scene?.children.list ?? [])
          .map((c) => c as unknown as { type: string; text?: string; depth: number })
          .filter((o) => (o.type === 'Text' || o.type === 'BitmapText') && typeof o.text === 'string')
          .map((o) => o.text ?? '');
        return labels.find((t) => /RIFLE|BLASTER|CARBINE|LASER|THROWER/.test(t)) ?? '';
      });

    for (const [weapon, letter] of [
      ['pulse', 'P'],
      ['scatter', 'S'],
      ['rapid', 'R'],
      ['laser', 'L'],
      ['flame', 'F']
    ] as const) {
      await page.evaluate((w) => window.__GAME_DEBUG__?.command('startAtCheckpoint', { id: 'start', weapon: w }), weapon);
      await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 2));
      const text = await hudWeaponText();
      expect(text.startsWith(letter + ' '), `${weapon} HUD reads "${text}"`).toBe(true);
    }
  });

  test('the new capsules are placed in the levels and show their letters', async ({ page }) => {
    await page.goto('/?debug=1&manualClock=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });

    const capsuleLetters = async (): Promise<string[]> =>
      page.evaluate(() => {
        const scene = window.__GAME__?.scene.getScene('level');
        return (scene?.children.list ?? [])
          .map((c) => c as unknown as { type: string; visible: boolean; text?: string })
          .filter((o) => (o.type === 'Text' || o.type === 'BitmapText') && o.visible && (o.text ?? '').length === 1)
          .map((o) => o.text ?? '');
      });

    // Level 1 carries the Lance Laser capsule on the raised one-way at x=1820.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1820 }));
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 4));
    expect(await capsuleLetters()).toContain('L');

    // Level 2 carries the Flare Thrower capsule on the raised one-way at x=1180.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel2'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level !== 'jungle-outpost');
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 1180 }));
    await page.evaluate(() => window.__GAME_DEBUG__?.command('advanceSteps', 4));
    expect(await capsuleLetters()).toContain('F');
  });
});
