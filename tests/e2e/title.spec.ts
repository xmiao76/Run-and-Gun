import { expect, test } from '@playwright/test';

test.describe('title screen', () => {
  test('loads the production build to the title screen without uncaught errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(String(error));
    });

    // The debug query parameter enables the read-only __GAME_DEBUG__ bridge
    // so the test can observe scene state deterministically, and forces the
    // Canvas 2D renderer because headless Chromium's software WebGL backend
    // cannot compile Phaser's shaders. Production keeps WebGL via AUTO.
    await page.goto('/?debug=1&renderer=canvas');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Wait until the title scene is active.
    await page.waitForFunction(() => {
      const state = window.__GAME_DEBUG__?.getState();
      return state !== undefined && state.scene === 'title';
    });

    const state = await page.evaluate(() => window.__GAME_DEBUG__?.getState());
    expect(state?.gameTitle).toBe('Operation Iron Echo');
    expect(state?.titleHeading).toBe('OPERATION IRON ECHO');
    expect(state?.scene).toBe('title');
    expect(pageErrors).toEqual([]);
  });

  test('offers the AI demo as a prominent prompt, not a footnote', async ({ page }) => {
    // Watching the pilot play is the fastest way for a new visitor to see what
    // this game is without committing to a run, but the invitation used to be
    // the last of four items on one dim 8px line at the very bottom of the
    // screen, where nobody found it.
    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    const labels = await page.evaluate(() => {
      const scene = window.__GAME__?.scene.getScene('title');
      return (scene?.children.list ?? [])
        .map((o) => o as unknown as { type: string; text?: string; y: number; scaleY: number })
        .filter((o) => (o.type === 'Text' || o.type === 'BitmapText') && typeof o.text === 'string')
        .map((o) => ({ text: o.text ?? '', y: o.y, scale: o.scaleY }));
    });

    const ai = labels.find((l) => /WATCH THE AI PLAY/.test(l.text));
    const start = labels.find((l) => /PRESS ENTER OR SPACE/.test(l.text));
    expect(ai, 'the AI prompt is missing from the title').toBeDefined();
    expect(start).toBeDefined();

    // Same size as the start prompt: a peer invitation, not a footnote. The
    // bottom hint line is drawn at half this scale.
    expect(ai?.scale).toBe(start?.scale);
    // Directly below the start prompt, in the reading path - not at the foot
    // of the screen with the version string.
    expect(ai!.y).toBeGreaterThan(start!.y);
    expect(ai!.y - start!.y).toBeLessThan(60);

    // And it must no longer be duplicated in the dim hint line.
    const hint = labels.find((l) => /PROTOTYPE ROOM/.test(l.text));
    expect(hint?.text).not.toMatch(/AI PLAY/);
  });

  test('the I key starts the AI demo straight from a cold title', async ({ page }) => {
    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.scene === 'title');

    await page.keyboard.press('i');
    await page.waitForFunction(
      () => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost',
      undefined,
      { timeout: 10_000 }
    );
    const runtime = await page.evaluate(() => window.__GAME_DEBUG__?.getState()?.runtime);
    // The promise the prompt makes: the AI is driving, hands-free.
    expect((runtime as { autopilot?: boolean }).autopilot).toBe(true);
  });
});
