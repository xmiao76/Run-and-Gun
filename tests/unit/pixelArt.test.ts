import { describe, expect, it } from 'vitest';

import { parsePixelArt, type PixelArtSpec } from '../../src/art/pixelArt';

const TWO_BY_TWO: PixelArtSpec = {
  palette: { o: '#ff0000', x: '#00ff00' },
  rows: ['ox', 'xo']
};

describe('parsePixelArt', () => {
  it('maps symbols to palette colors in row-major order', () => {
    const grid = parsePixelArt(TWO_BY_TWO);
    expect(grid.width).toBe(2);
    expect(grid.height).toBe(2);
    expect(grid.pixels).toEqual(['#ff0000', '#00ff00', '#00ff00', '#ff0000']);
  });

  it('treats spaces as transparent pixels', () => {
    const grid = parsePixelArt({ palette: { o: '#123456' }, rows: ['o o'] });
    expect(grid.pixels).toEqual(['#123456', null, '#123456']);
  });

  it('pads ragged rows with transparency up to the widest row', () => {
    const grid = parsePixelArt({ palette: { o: '#123456' }, rows: ['ooo', 'o'] });
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(2);
    expect(grid.pixels).toEqual(['#123456', '#123456', '#123456', '#123456', null, null]);
  });

  it('throws a descriptive error for a symbol missing from the palette', () => {
    expect(() => parsePixelArt({ palette: { o: '#123456' }, rows: ['oz'] })).toThrow(
      /unknown symbol "z"/
    );
  });

  it('throws when no rows are provided', () => {
    expect(() => parsePixelArt({ palette: { o: '#123456' }, rows: [] })).toThrow(/at least one row/);
  });

  it('accepts a fully transparent row as valid content', () => {
    const grid = parsePixelArt({ palette: { o: '#123456' }, rows: ['   ', ' o '] });
    expect(grid.width).toBe(3);
    expect(grid.pixels).toEqual([null, null, null, null, '#123456', null]);
  });
});
