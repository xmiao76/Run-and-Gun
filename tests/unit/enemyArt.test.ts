import { describe, expect, it } from 'vitest';

import { enemyTexture } from '../../src/art/enemyArt';
import { ENEMY_DEFS, type EnemyKind } from '../../src/balance/enemies';
import { parsePixelArt } from '../../src/art/pixelArt';
import { SPRITE_SPECS, type SpriteKey } from '../../src/art/sprites';

const KINDS = Object.keys(ENEMY_DEFS) as EnemyKind[];

describe('enemyTexture', () => {
  it('gives every enemy kind a distinct sprite', () => {
    const textures = KINDS.map(enemyTexture);
    expect(new Set(textures).size).toBe(KINDS.length);
  });

  it('only returns textures that exist in the sprite sheet', () => {
    for (const kind of KINDS) {
      const key = enemyTexture(kind) as SpriteKey;
      expect(SPRITE_SPECS[key], key).toBeDefined();
      expect(() => parsePixelArt(SPRITE_SPECS[key])).not.toThrow();
    }
  });

  it('keeps enemy sprites within their collision bounds (+/- 2px grace)', () => {
    for (const kind of KINDS) {
      const def = ENEMY_DEFS[kind];
      const grid = parsePixelArt(SPRITE_SPECS[enemyTexture(kind) as SpriteKey]);
      expect(grid.width, kind).toBeGreaterThanOrEqual(def.width - 6);
      expect(grid.width, kind).toBeLessThanOrEqual(def.width + 2);
      expect(grid.height, kind).toBeGreaterThanOrEqual(def.height - 2);
      expect(grid.height, kind).toBeLessThanOrEqual(def.height + 2);
    }
  });
});
