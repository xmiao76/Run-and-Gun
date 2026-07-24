import { describe, expect, it } from 'vitest';

import { parsePixelArt } from '../../src/art/pixelArt';
import { SPRITE_SPECS, type SpriteKey } from '../../src/art/sprites';
import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../../src/balance/player';

const KEYS = Object.keys(SPRITE_SPECS) as SpriteKey[];

/** Solid fill tiles must have no transparent pixels in their filled rows. */
const OPAQUE_TILE_KEYS: SpriteKey[] = ['art/tile-hazard'];

describe('sprite sheet', () => {
  it('compiles every sprite spec without unknown symbols', () => {
    for (const key of KEYS) {
      expect(() => parsePixelArt(SPRITE_SPECS[key]), key).not.toThrow();
    }
  });

  it('keeps solid tiles fully opaque (no seam pixels)', () => {
    for (const key of OPAQUE_TILE_KEYS) {
      const grid = parsePixelArt(SPRITE_SPECS[key]);
      expect(grid.pixels.every((p) => p !== null), key).toBe(true);
    }
    // The ground tile's top row is a grass silhouette and may be transparent;
    // every row below it must be solid so dirt never shows sky seams.
    const ground = parsePixelArt(SPRITE_SPECS['art/tile-ground']);
    const belowTop = ground.pixels.slice(ground.width);
    expect(belowTop.every((p) => p !== null), 'art/tile-ground rows 1+').toBe(true);
  });

  it('matches the player hitbox dimensions (22x32)', () => {
    for (const key of ['art/player-idle', 'art/player-run-a', 'art/player-run-b'] as const) {
      const grid = parsePixelArt(SPRITE_SPECS[key]);
      expect(grid.width, key).toBe(PLAYER_WIDTH);
      expect(grid.height, key).toBe(PLAYER_HEIGHT);
    }
  });

  it('keeps enemy sprites close to their collision sizes', () => {
    const runner = parsePixelArt(SPRITE_SPECS['art/enemy-runner']);
    expect(runner.width).toBeGreaterThanOrEqual(16);
    expect(runner.width).toBeLessThanOrEqual(22);
    expect(runner.height).toBe(30);
    const sentry = parsePixelArt(SPRITE_SPECS['art/enemy-sentry']);
    expect(sentry.width).toBeGreaterThanOrEqual(20);
    expect(sentry.width).toBeLessThanOrEqual(24);
    expect(sentry.height).toBe(24);
  });
});
