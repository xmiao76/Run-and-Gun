import { describe, expect, it } from 'vitest';

import {
  buildFontSheet,
  hasGlyph,
  CHARS_PER_ROW,
  FONT_CHARS,
  GLYPH_H,
  GLYPH_W
} from '../../src/art/font';
import { parsePixelArt } from '../../src/art/pixelArt';

/**
 * The font sheet is a UV grid, not a picture: RetroFont slices it by cell size
 * and character order, so a single short row or a missing glyph silently shifts
 * every character after it rather than failing. These tests pin the geometry.
 */

describe('font sheet geometry', () => {
  const sheet = buildFontSheet();
  const grid = parsePixelArt(sheet);

  it('declares art for every character it advertises', () => {
    for (const char of FONT_CHARS) {
      expect(hasGlyph(char), `no glyph for "${char}"`).toBe(true);
    }
  });

  it('has no duplicate characters, which would make one unreachable', () => {
    expect(new Set(FONT_CHARS).size).toBe(FONT_CHARS.length);
  });

  it('is exactly a whole number of glyph cells in both axes', () => {
    expect(grid.width).toBe(CHARS_PER_ROW * GLYPH_W);
    expect(grid.width % GLYPH_W).toBe(0);
    expect(grid.height % GLYPH_H).toBe(0);
  });

  it('is tall enough to hold every character', () => {
    const rowsNeeded = Math.ceil(FONT_CHARS.length / CHARS_PER_ROW);
    expect(grid.height).toBe(rowsNeeded * GLYPH_H);
  });

  it('has no ragged rows', () => {
    // parsePixelArt tolerates short rows by padding, which would silently
    // shift the UVs of every glyph after the short one.
    for (const [index, row] of sheet.rows.entries()) {
      expect(row.length, `row ${index} is ragged`).toBe(grid.width);
    }
  });

  it('keeps the last pixel row and column of each cell clear, so glyphs cannot touch', () => {
    const at = (x: number, y: number) => grid.pixels[y * grid.width + x];
    for (let cellY = 0; cellY * GLYPH_H < grid.height; cellY++) {
      for (let cellX = 0; cellX < CHARS_PER_ROW; cellX++) {
        const lastCol = cellX * GLYPH_W + GLYPH_W - 1;
        const lastRow = cellY * GLYPH_H + GLYPH_H - 1;
        for (let y = cellY * GLYPH_H; y < (cellY + 1) * GLYPH_H; y++) {
          expect(at(lastCol, y)).toBeNull();
        }
        for (let x = cellX * GLYPH_W; x < (cellX + 1) * GLYPH_W; x++) {
          expect(at(x, lastRow)).toBeNull();
        }
      }
    }
  });

  it('draws space as genuinely empty', () => {
    // Space is the first cell; if it had ink, every gap in every string would.
    const at = (x: number, y: number) => grid.pixels[y * grid.width + x];
    for (let y = 0; y < GLYPH_H; y++) {
      for (let x = 0; x < GLYPH_W; x++) {
        expect(at(x, y)).toBeNull();
      }
    }
  });

  it('draws ink for a character that should have some', () => {
    // Guards against a sheet that is geometrically perfect and entirely blank.
    const indexOfA = FONT_CHARS.indexOf('A');
    const cellX = (indexOfA % CHARS_PER_ROW) * GLYPH_W;
    const cellY = Math.floor(indexOfA / CHARS_PER_ROW) * GLYPH_H;
    let lit = 0;
    for (let y = cellY; y < cellY + GLYPH_H; y++) {
      for (let x = cellX; x < cellX + GLYPH_W; x++) {
        if (grid.pixels[y * grid.width + x] !== null) {
          lit += 1;
        }
      }
    }
    expect(lit).toBeGreaterThan(5);
  });

  it('uses a single ink colour, so tinting works predictably', () => {
    const colours = new Set(grid.pixels.filter((p): p is string => p !== null));
    expect(colours.size).toBe(1);
  });
});

/**
 * The arrow and degree glyphs, added after the first title screenshot showed
 * them rendering blank. These began life as a throwaway diagnostic; they are
 * kept because each one pins a mistake that was actually made - a glyph that
 * duplicated another, an arrow that pointed the wrong way, and a character
 * that was in the string but had no art.
 */
describe('arrow and degree glyphs', () => {
  const sheet = buildFontSheet();

  function cell(char: string): string[] {
    const index = FONT_CHARS.indexOf(char);
    const cx = (index % CHARS_PER_ROW) * GLYPH_W;
    const cy = Math.floor(index / CHARS_PER_ROW) * GLYPH_H;
    return sheet.rows.slice(cy, cy + GLYPH_H).map((row) => row.slice(cx, cx + GLYPH_W));
  }

  it('left and right arrows are mirrors, not duplicates of up/down', () => {
    const left = cell('←');
    const right = cell('→');
    const up = cell('↑');
    expect(left).not.toEqual(up);
    expect(right).not.toEqual(cell('↓'));
    // mirror across the vertical axis of the 5-wide glyph, not the 6-wide cell
    const mirrored = left.map((row) => row.slice(0, 5).split('').reverse().join('') + row.slice(5));
    expect(right).toEqual(mirrored);
  });

  it('left arrow points left: ink touches the left cell edge mid-height', () => {
    const left = cell('←');
    // the middle rows carry the full-width bar; the point must be at x=0 or x=1
    const middleRows = left.slice(2, 5);
    const leftmost = middleRows.some((row) => row[0] === '#' || row[1] === '#');
    expect(leftmost).toBe(true);
  });

  it('every one of the new glyphs is in FONT_CHARS exactly once and has art', () => {
    for (const ch of ['↑', '↓', '←', '→', '°']) {
      expect(FONT_CHARS.split('').filter((c) => c === ch)).toHaveLength(1);
      const art = cell(ch);
      const lit = art.join('').split('').filter((p) => p === '#').length;
      expect(lit, `${ch} renders blank`).toBeGreaterThan(0);
    }
  });
});
