/**
 * Pixel-art sprite compiler.
 *
 * Sprites are authored as arrays of strings ("pixel maps") where each
 * character maps to a palette color and spaces mean transparency. This module
 * is pure and Phaser-free so the mapping rules stay unit-testable; the scene
 * layer turns the resulting grids into canvas textures (see textures.ts).
 */

/** A sprite definition: single-character symbols mapped to '#rrggbb' colors. */
export interface PixelArtSpec {
  readonly palette: Record<string, string>;
  readonly rows: readonly string[];
}

/** A compiled sprite: row-major pixels, `null` marking transparency. */
export interface PixelGrid {
  readonly width: number;
  readonly height: number;
  readonly pixels: readonly (string | null)[];
}

/**
 * Compiles a pixel map into a grid. Rows may be ragged; short rows are padded
 * with transparency up to the widest row. Unknown symbols and empty input are
 * rejected so authoring mistakes fail loudly instead of rendering wrong.
 */
export function parsePixelArt(spec: PixelArtSpec): PixelGrid {
  if (spec.rows.length === 0) {
    throw new Error('pixel art requires at least one row');
  }
  const width = Math.max(...spec.rows.map((row) => row.length));
  const pixels: (string | null)[] = [];
  for (const row of spec.rows) {
    for (let x = 0; x < width; x++) {
      const symbol = row[x] ?? ' ';
      if (symbol === ' ') {
        pixels.push(null);
        continue;
      }
      const color = spec.palette[symbol];
      if (color === undefined) {
        throw new Error(`pixel art uses unknown symbol "${symbol}" (no palette entry)`);
      }
      pixels.push(color);
    }
  }
  return { width, height: spec.rows.length, pixels };
}
