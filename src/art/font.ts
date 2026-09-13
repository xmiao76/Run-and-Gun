/**
 * Original 5x7 pixel font, authored the same way as every other sprite.
 *
 * Phaser's RetroFont wants one texture holding a uniform grid of glyph cells,
 * so the glyphs are written individually here and composed into that grid by
 * `buildFontSheet()` - the same trick `groundRows()` in `sprites.ts` uses to
 * guarantee a seamless tile. Writing one 96x32 block of strings by hand would
 * be unreadable and impossible to edit a letter at a time.
 *
 * Uppercase only, which is both authentic for an arcade cabinet and halves the
 * glyphs to draw; `drawText` uppercases its input so no caller has to care.
 *
 * Glyphs are drawn in white and tinted at use, so the existing colour scheme is
 * unchanged by the switch away from the system font.
 *
 * No font files are shipped - see ASSET_POLICY.md.
 */

import { type PixelArtSpec } from './pixelArt';

/** Drawn area of a glyph. */
const GLYPH_COLS = 5;
const GLYPH_ROWS = 7;

/** Cell size in the sheet: the drawn area plus one pixel of spacing. */
export const GLYPH_W = GLYPH_COLS + 1;
export const GLYPH_H = GLYPH_ROWS + 1;

/** Glyphs per row in the generated sheet. */
export const CHARS_PER_ROW = 16;

/**
 * Every character the font can draw, in sheet order.
 *
 * RetroFont maps this string onto the grid left-to-right, top-to-bottom, so the
 * order here IS the layout. Space is first and is deliberately blank.
 */
export const FONT_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?-+/()<>=%*#↑↓←→°';

const O = ' ';
const X = '#';

/** 5x7 glyph art. `#` is a lit pixel, a space is transparent. */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  ' ': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  C: [' ### ', '#   #', '#    ', '#    ', '#    ', '#   #', ' ### '],
  D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  F: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
  G: [' ### ', '#   #', '#    ', '#  ##', '#   #', '#   #', ' ### '],
  H: ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  I: [' ### ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  J: ['    #', '    #', '    #', '    #', '#   #', '#   #', ' ### '],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  Q: [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
  Y: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': ['#####', '   # ', '  #  ', '   # ', '    #', '#   #', ' ### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': ['  ## ', ' #   ', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '   # ', ' ##  '],
  '.': ['     ', '     ', '     ', '     ', '     ', ' ##  ', ' ##  '],
  ',': ['     ', '     ', '     ', '     ', ' ##  ', ' ##  ', ' #   '],
  ':': ['     ', ' ##  ', ' ##  ', '     ', ' ##  ', ' ##  ', '     '],
  ';': ['     ', ' ##  ', ' ##  ', '     ', ' ##  ', ' ##  ', ' #   '],
  '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  '-': ['     ', '     ', '     ', '#####', '     ', '     ', '     '],
  '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '],
  '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
  '(': ['   # ', '  #  ', ' #   ', ' #   ', ' #   ', '  #  ', '   # '],
  ')': [' #   ', '  #  ', '   # ', '   # ', '   # ', '  #  ', ' #   '],
  '<': ['   # ', '  #  ', ' #   ', '#    ', ' #   ', '  #  ', '   # '],
  '>': [' #   ', '  #  ', '   # ', '    #', '   # ', '  #  ', ' #   '],
  '=': ['     ', '     ', '#####', '     ', '#####', '     ', '     '],
  '%': ['#   #', '#  # ', '   # ', '  #  ', ' #   ', ' #  #', '#   #'],
  '*': ['     ', '#   #', ' # # ', '#####', ' # # ', '#   #', '     '],
  '#': [' # # ', ' # # ', '#####', ' # # ', '#####', ' # # ', ' # # '],
  '↑': ['  #  ', ' ### ', '# # #', '  #  ', '  #  ', '  #  ', '  #  '],
  '↓': ['  #  ', '  #  ', '  #  ', '  #  ', '# # #', ' ### ', '  #  '],
  '←': ['  #  ', ' ##  ', '#####', '#####', '#####', ' ##  ', '  #  '],
  '→': ['  #  ', '  ## ', '#####', '#####', '#####', '  ## ', '  #  '],
  '°': [' ##  ', '#  # ', ' ##  ', '     ', '     ', '     ', '     ']
};

/**
 * Compose the glyph grid into one sprite spec.
 *
 * Every row is padded to the full sheet width so the generated spec has no
 * ragged rows - `parsePixelArt` tolerates ragged input, but a font sheet with
 * short rows would silently shift the UV of every glyph after it.
 */
export function buildFontSheet(): PixelArtSpec {
  const rowsOfGlyphs = Math.ceil(FONT_CHARS.length / CHARS_PER_ROW);
  const sheetWidth = CHARS_PER_ROW * GLYPH_W;
  const rows: string[] = [];

  for (let gy = 0; gy < rowsOfGlyphs; gy++) {
    for (let py = 0; py < GLYPH_H; py++) {
      let line = '';
      for (let gx = 0; gx < CHARS_PER_ROW; gx++) {
        const index = gy * CHARS_PER_ROW + gx;
        const char = index < FONT_CHARS.length ? FONT_CHARS[index] : ' ';
        const glyph = GLYPHS[char];
        // The last pixel row and column of every cell are spacing.
        const art = glyph !== undefined && py < GLYPH_ROWS ? glyph[py] : O.repeat(GLYPH_COLS);
        line += art.padEnd(GLYPH_COLS, O) + O;
      }
      rows.push(line.padEnd(sheetWidth, O));
    }
  }

  return { palette: { [X]: '#ffffff' }, rows };
}

/** Characters the font can draw, for validation and tests. */
export function hasGlyph(char: string): boolean {
  return Object.prototype.hasOwnProperty.call(GLYPHS, char);
}

export const FONT_SHEET: PixelArtSpec = buildFontSheet();
