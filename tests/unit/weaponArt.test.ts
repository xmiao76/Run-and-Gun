import { describe, expect, it } from 'vitest';

import { bulletTexture } from '../../src/art/weaponArt';
import { WEAPON_ORDER } from '../../src/balance/weapons';
import { parsePixelArt } from '../../src/art/pixelArt';
import { SPRITE_SPECS, type SpriteKey } from '../../src/art/sprites';

describe('bulletTexture', () => {
  it('gives every weapon a distinct projectile texture', () => {
    const textures = WEAPON_ORDER.map(bulletTexture);
    expect(new Set(textures).size).toBe(WEAPON_ORDER.length);
  });

  it('maps weapons to their authored sprites', () => {
    expect(bulletTexture('pulse')).toBe('art/bullet-pulse');
    expect(bulletTexture('scatter')).toBe('art/bullet-scatter');
    expect(bulletTexture('rapid')).toBe('art/bullet-rapid');
  });

  it('only returns textures that exist in the sprite sheet', () => {
    for (const weapon of WEAPON_ORDER) {
      const key = bulletTexture(weapon) as SpriteKey;
      expect(SPRITE_SPECS[key], key).toBeDefined();
      expect(() => parsePixelArt(SPRITE_SPECS[key])).not.toThrow();
    }
  });
});
