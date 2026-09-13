import { describe, expect, it } from 'vitest';

import {
  isPaletteColour,
  nearestPaletteColour,
  PALETTE,
  PALETTE_HEX
} from '../../src/art/palette';
import { FONT_SHEET } from '../../src/art/font';
import { SPRITE_SPECS } from '../../src/art/sprites';
import { parsePixelArt } from '../../src/art/pixelArt';

/**
 * The palette is a discipline, and disciplines need a tripwire.
 *
 * These tests are what let `nearestPaletteColour` be a safety net rather than
 * the mechanism: every colour the game can draw is asserted to be IN the
 * palette, so the quantiser in `gridToCanvas` should never actually run.
 */

const PALETTE_VALUES = Object.values(PALETTE);
const HEX_VALUES = Object.values(PALETTE_HEX);

function specColours(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [key, spec] of Object.entries(SPRITE_SPECS)) {
    for (const colour of Object.values(spec.palette)) {
      out.push([key, colour]);
    }
  }
  return out;
}

describe('palette', () => {
  it('contains every colour the sprite sheet declares', () => {
    for (const [key, colour] of specColours()) {
      expect(isPaletteColour(colour), `${key} uses off-palette colour ${colour}`).toBe(true);
    }
  });

  it('contains every colour the sky gradients use', () => {
    // Raw source via Vite's glob import: the repo deliberately has no
    // @types/node, so tests read files this way rather than through node:fs.
    const sources = import.meta.glob('../../src/art/textures.ts', { as: 'raw', eager: true });
    for (const source of Object.values(sources)) {
      for (const match of source.matchAll(/color: '(#[0-9a-f]{6})'/g)) {
        expect(isPaletteColour(match[1]), `sky stop uses off-palette colour ${match[1]}`).toBe(true);
      }
    }
  });

  it('contains the font sheet colour', () => {
    for (const colour of Object.values(FONT_SHEET.palette)) {
      expect(isPaletteColour(colour)).toBe(true);
    }
  });

  it('keeps scene code free of hardcoded colour literals', () => {
    // Scenes must pull from PALETTE_HEX instead of writing 0x...... literals,
    // or the palette stops being the single source.
    const sources = import.meta.glob('../../src/scenes/*.ts', { as: 'raw', eager: true });
    for (const [file, source] of Object.entries(sources)) {
      const literals = source.match(/0x[0-9a-fA-F]{6}\b/g) ?? [];
      expect(literals, `${file} hardcodes colours: ${literals.join(', ')}`).toEqual([]);
    }
  });

  it('maps every palette colour to itself, so the safety net is idempotent', () => {
    for (const colour of PALETTE_VALUES) {
      expect(nearestPaletteColour(colour)).toBe(colour);
    }
  });

  it('maps near-duplicates onto a single entry, the exact failure it was built for', () => {
    // The original sheet carried two indistinguishable greys.
    expect(nearestPaletteColour('#7a8494')).toBe(nearestPaletteColour('#7a8694'));
    // And two telegraph golds.
    expect(nearestPaletteColour('#ffcc44')).toBe(PALETTE.GOLD);
  });

  it('renders every sprite through palette colours after parsing', () => {
    // Belt and braces: parse every spec and walk every pixel, not just the
    // palette declarations.
    for (const [key, spec] of Object.entries(SPRITE_SPECS)) {
      const grid = parsePixelArt(spec);
      for (const pixel of grid.pixels) {
        if (pixel !== null) {
          expect(isPaletteColour(pixel), `${key} draws off-palette pixel ${pixel}`).toBe(true);
        }
      }
    }
  });

  it('keeps PALETTE_HEX in exact agreement with PALETTE', () => {
    expect(Object.keys(PALETTE_HEX).sort()).toEqual(Object.keys(PALETTE).sort());
    for (const colour of Object.values(PALETTE)) {
      expect(HEX_VALUES).toContain(parseInt(colour.slice(1), 16));
    }
  });

  it('has no duplicate colours hiding under two names', () => {
    expect(new Set(PALETTE_VALUES).size).toBe(PALETTE_VALUES.length);
  });

  it('stays small enough to be a discipline rather than a catalogue', () => {
    // The point is restraint: 110 freeform colours became ~40. Letting this
    // creep back up undoes the task, so it is pinned.
    expect(PALETTE_VALUES.length).toBeLessThanOrEqual(48);
  });
});
