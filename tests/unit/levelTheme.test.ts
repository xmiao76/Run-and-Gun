import { describe, expect, it } from 'vitest';

import { FORTRESS_THEME, JUNGLE_THEME, horizonForLevel, propsForSolid, themeForLevel, type LevelTheme } from '../../src/art/levelTheme';
import { SPRITE_SPECS, type SpriteKey } from '../../src/art/sprites';

const GROUND_Y = 480;

function expectThemeTexturesExist(theme: LevelTheme): void {
  expect(SPRITE_SPECS[theme.groundTile as SpriteKey]).toBeDefined();
  expect(SPRITE_SPECS[theme.oneWayTile as SpriteKey]).toBeDefined();
  if (theme.bandKey !== null) {
    expect(SPRITE_SPECS[theme.bandKey as SpriteKey]).toBeDefined();
  }
  if (theme.pipesKey !== null) {
    expect(SPRITE_SPECS[theme.pipesKey as SpriteKey]).toBeDefined();
  }
  for (const key of theme.horizonKeys) {
    expect(SPRITE_SPECS[key as SpriteKey], key).toBeDefined();
  }
  for (const key of theme.propKeys) {
    expect(SPRITE_SPECS[key as SpriteKey], key).toBeDefined();
  }
}

describe('themeForLevel', () => {
  it('returns the jungle theme for level 1 with existing textures', () => {
    expect(themeForLevel('jungle-outpost')).toBe(JUNGLE_THEME);
    expectThemeTexturesExist(JUNGLE_THEME);
  });

  it('returns the fortress theme for level 2 with existing textures', () => {
    expect(themeForLevel('fortress-interior')).toBe(FORTRESS_THEME);
    expectThemeTexturesExist(FORTRESS_THEME);
  });

  it('falls back to the default theme for unknown levels', () => {
    expect(themeForLevel('no-such-level')).toBe(JUNGLE_THEME);
  });

  it('gives the two levels visually distinct identities', () => {
    expect(FORTRESS_THEME.groundTile).not.toBe(JUNGLE_THEME.groundTile);
    expect(FORTRESS_THEME.skyKey).not.toBe(JUNGLE_THEME.skyKey);
    expect(FORTRESS_THEME.showStars).toBe(false);
    expect(JUNGLE_THEME.showStars).toBe(true);
    expect(FORTRESS_THEME.horizonKeys).not.toEqual(JUNGLE_THEME.horizonKeys);
  });
});

describe('propsForSolid', () => {
  const theme = JUNGLE_THEME;

  it('scatters props within the span, clear of the edges', () => {
    const props = propsForSolid({ x: 0, y: GROUND_Y, width: 900, height: 60 }, theme, GROUND_Y);
    expect(props.length).toBeGreaterThanOrEqual(2);
    for (const p of props) {
      expect(p.x).toBeGreaterThanOrEqual(60);
      expect(p.x).toBeLessThanOrEqual(900 - 60);
      expect(p.y).toBe(GROUND_Y + 1);
      expect(theme.propKeys).toContain(p.key);
    }
  });

  it('is deterministic for the same rect', () => {
    const a = propsForSolid({ x: 100, y: GROUND_Y, width: 800, height: 60 }, theme, GROUND_Y);
    const b = propsForSolid({ x: 100, y: GROUND_Y, width: 800, height: 60 }, theme, GROUND_Y);
    expect(a).toEqual(b);
  });

  it('returns nothing for spans too short to decorate', () => {
    expect(propsForSolid({ x: 0, y: GROUND_Y, width: 100, height: 60 }, theme, GROUND_Y)).toEqual([]);
  });
});

describe('horizonForLevel', () => {
  it('scatters silhouettes across the level width, in bounds', () => {
    const items = horizonForLevel(3200, GROUND_Y, JUNGLE_THEME.horizonKeys);
    expect(items.length).toBeGreaterThanOrEqual(5);
    for (const item of items) {
      expect(item.x).toBeGreaterThanOrEqual(180);
      expect(item.x).toBeLessThanOrEqual(3200 - 120);
      expect(item.y).toBe(GROUND_Y);
      expect(SPRITE_SPECS[item.key as SpriteKey], item.key).toBeDefined();
    }
  });

  it('is deterministic and uses both silhouette types', () => {
    const a = horizonForLevel(3200, GROUND_Y, JUNGLE_THEME.horizonKeys);
    expect(a).toEqual(horizonForLevel(3200, GROUND_Y, JUNGLE_THEME.horizonKeys));
    expect(new Set(a.map((i) => i.key)).size).toBe(2);
  });

  it('places fortress machinery for level 2', () => {
    const items = horizonForLevel(3200, GROUND_Y, FORTRESS_THEME.horizonKeys);
    expect(new Set(items.map((i) => i.key))).toEqual(new Set(FORTRESS_THEME.horizonKeys));
  });

  it('returns nothing when a theme has no horizon keys', () => {
    expect(horizonForLevel(3200, GROUND_Y, [])).toEqual([]);
  });
});
