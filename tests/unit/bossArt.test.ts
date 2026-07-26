import { describe, expect, it } from 'vitest';

import { bossTexture } from '../../src/art/bossArt';
import { BOSS_DEFS, type BossId } from '../../src/balance/bosses';
import { parsePixelArt } from '../../src/art/pixelArt';
import { SPRITE_SPECS, type SpriteKey } from '../../src/art/sprites';

const IDS = Object.keys(BOSS_DEFS) as BossId[];

describe('bossTexture', () => {
  it('gives every boss a distinct sprite', () => {
    const textures = IDS.map(bossTexture);
    expect(new Set(textures).size).toBe(IDS.length);
  });

  it('only returns textures that exist and fit the boss hitbox', () => {
    for (const id of IDS) {
      const key = bossTexture(id) as SpriteKey;
      expect(SPRITE_SPECS[key], key).toBeDefined();
      const grid = parsePixelArt(SPRITE_SPECS[key]);
      const def = BOSS_DEFS[id];
      // The scene stretches sprites to the hitbox; require close coverage.
      expect(grid.width, id).toBeGreaterThanOrEqual(def.width - 14);
      expect(grid.height, id).toBe(def.height);
    }
  });
});
