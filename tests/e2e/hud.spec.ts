import { expect, test } from '@playwright/test';

async function hudInfo(page: import('@playwright/test').Page): Promise<{
  lifeIcons: number;
  weaponIcon: string;
  weaponText: string;
  scoreText: string;
  bossLabel: string;
}> {
  return page.evaluate(() => {
    const scene = window.__GAME__?.scene.getScene('level');
    const out = { lifeIcons: 0, weaponIcon: '', weaponText: '', scoreText: '', bossLabel: '' };
    if (!scene) {
      return out;
    }
    for (const c of scene.children.list) {
      const o = c as unknown as { type: string; visible: boolean; texture?: { key?: string }; text?: string; depth: number };
      if (!o.visible) {
        continue;
      }
      if (o.type === 'Image' && o.texture?.key === 'art/ui-life') {
        out.lifeIcons += 1;
      }
      if (o.type === 'Image' && (o.texture?.key ?? '').startsWith('art/bullet') && o.depth === 100) {
        out.weaponIcon = o.texture?.key ?? '';
      }
      if (o.type === 'Text' && typeof o.text === 'string') {
        if (/RIFLE|BLASTER|CARBINE/.test(o.text)) {
          out.weaponText = o.text;
        }
        if (o.text.startsWith('SCORE')) {
          out.scoreText = o.text;
        }
        if (o.text === 'SIEGE WALKER' || o.text === 'REACTOR WARDEN') {
          out.bossLabel = o.text;
        }
      }
    }
    return out;
  });
}

/**
 * HUD (TASK-009): lives as icons, weapon icon + name, score readout, and a
 * boss name plate - all readable and coherent with the pixel-art presentation.
 */
test.describe('HUD presentation', () => {
  test('shows lives, weapon, score, and boss name visually', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await page.goto('/?debug=1&renderer=canvas');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => window.__GAME_DEBUG__?.command('startLevel1'));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.level === 'jungle-outpost');

    let hud = await hudInfo(page);
    expect(hud.lifeIcons).toBe(3);
    expect(hud.weaponIcon).toBe('art/bullet-pulse');
    expect(hud.weaponText).toBe('PULSE RIFLE');
    expect(hud.scoreText).toBe('SCORE 0');

    // Weapon pickup: icon and name follow the current weapon.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 360 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.weapon === 'scatter');
    hud = await hudInfo(page);
    expect(hud.weaponIcon).toBe('art/bullet-scatter');
    expect(hud.weaponText).toBe('SCATTER BLASTER');

    // Pit death: one life icon disappears after respawn.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 780, y: 800 }));
    await page.waitForFunction(() => (window.__GAME_DEBUG__?.getState()?.runtime?.lives ?? 3) === 2);
    hud = await hudInfo(page);
    expect(hud.lifeIcons).toBe(2);

    // Boss name plate appears with the boss bar.
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2450 }));
    await page.waitForTimeout(150);
    await page.evaluate(() => window.__GAME_DEBUG__?.command('teleportPlayer', { x: 2600 }));
    await page.waitForFunction(() => window.__GAME_DEBUG__?.getState()?.runtime?.bossActive === true);
    hud = await hudInfo(page);
    expect(hud.bossLabel).toBe('SIEGE WALKER');

    expect(pageErrors).toEqual([]);
  });
});
