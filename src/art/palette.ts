/**
 * The single place a colour is defined for the game's art.
 *
 * Before this existed, every sprite, sky gradient, particle, HUD rectangle and
 * telegraph picked its own hex value - 110 unique colours in a muted dusk
 * direction, with 14 on the player alone and two greys (#7a8494 / #7a8694) that
 * are indistinguishable at arm's length. Classic run-and-gun art is the
 * opposite discipline: a small, saturated palette where every colour is doing
 * visible work.
 *
 * The ramps below keep the game's identity (dusk jungle, rust, visor gold) but
 * push it NES-ward: fewer shades, more saturation on the mids and lights, and
 * near-black backgrounds for contrast. Three ways of using it:
 *
 *  - `PALETTE`     - named CSS colours for sprite palettes and sky stops
 *  - `PALETTE_HEX` - the same as Phaser 0x numbers for scene primitives
 *  - `nearestPaletteColour` - the quantiser that migrated 110 colours onto
 *    this set; kept as a safety net inside gridToCanvas
 *
 * Adding art means picking from here. A colour outside this table fails
 * tests/unit/palette.test.ts.
 */

/** Named CSS colours, grouped by ramp. */
export const PALETTE = {
  // Near-blacks: backgrounds, voids, deep shadows
  BLACK: '#000000',
  VOID: '#05070c',
  INK: '#0b0f1a',
  PANEL: '#141f33',
  DARK: '#1c2733',

  // Metal: enemies, machines, barrels
  METAL_DARK: '#31383f',
  METAL_MID: '#4c5560',
  METAL: '#68727f',
  METAL_LIGHT: '#9aa7b4',

  // Blue: sky depth, sentry plating, ridge silhouettes
  BLUE_DARK: '#22334a',
  BLUE: '#3a5a7a',
  BLUE_LIGHT: '#8ea6c9',

  // Jungle greens
  FOREST: '#1d3a2a',
  LEAF_DARK: '#2c543a',
  LEAF: '#3d8549',
  LEAF_LIGHT: '#58b368',
  OLIVE: '#6a8a4a',

  // Earth and wood
  BROWN_DARK: '#413325',
  BROWN: '#6a4e28',
  TAN: '#b08a4a',
  SKIN: '#e8b06f',
  SKIN_LIGHT: '#ffc38a',

  // Reds: runner, dome, boss bar, blood-warm accents
  RED_DARK: '#7a2a20',
  RED: '#c84a34',
  RED_LIGHT: '#ff5544',
  RED_PALE: '#ffd6c8',

  // Gold: visors, optic lenses, sparks, telegraphs
  GOLD: '#ffd23f',
  GOLD_LIGHT: '#ffee88',
  GOLD_PALE: '#fff6d8',
  YELLOW: '#ffff66',

  // Oranges: muzzle fire, rust, explosions
  RUST: '#c96f3b',
  FIRE: '#ff8a3a',
  FIRE_LIGHT: '#ffab5a',

  // Cyans: drone accents, beacons, pickups
  CYAN_DARK: '#2a6a8a',
  CYAN: '#4fc3e8',
  CYAN_LIGHT: '#9ad1ff',
  MINT: '#57d9a3',

  // Purple: the grenadier's one-family identity
  PURPLE_DARK: '#4a2a52',
  PURPLE: '#7a4a8a',

  // Whites
  WHITE: '#ffffff',
  PALE: '#e8f1ff'
} as const;

export type PaletteName = keyof typeof PALETTE;
export type PaletteColour = (typeof PALETTE)[PaletteName];

const ALL: readonly PaletteColour[] = Object.values(PALETTE);

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/**
 * Perceptual-ish distance ("redmean"): weights the red difference by the
 * average red level, which tracks how humans actually rank colour similarity
 * far better than plain Euclidean RGB.
 */
function colourDistance(a: [number, number, number], b: [number, number, number]): number {
  const rMean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const wr = 2 + rMean / 256;
  const wb = 2 + (255 - rMean) / 256;
  return wr * dr * dr + 4 * dg * dg + wb * db * db;
}

/**
 * Nearest palette entry to an arbitrary hex colour.
 *
 * Used once, deliberately: the migration of the original 110 hand-picked
 * colours onto the palette. It stays wired into `gridToCanvas` as a safety net
 * so a colour that sneaks past review still lands inside the palette instead
 * of breaking the discipline - and tests/unit/palette.test.ts is what makes
 * sure it is never actually needed.
 */
export function nearestPaletteColour(colour: string): PaletteColour {
  const target = hexToRgb(colour);
  let best: PaletteColour = PALETTE.WHITE;
  let bestDistance = Infinity;
  for (const candidate of ALL) {
    const distance = colourDistance(target, hexToRgb(candidate));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

/** True when a CSS colour is exactly one of the palette entries. */
export function isPaletteColour(colour: string): boolean {
  return (ALL as readonly string[]).includes(colour.toLowerCase());
}

/**
 * The same colours as Phaser 0x numbers, for scene primitives (HUD rectangles,
 * boss bar, telegraph strokes, particles, pit void, tints). Scenes import from
 * here instead of writing a literal, so the palette stays the single source.
 */
function toHex(colour: string): number {
  return parseInt(colour.slice(1), 16);
}

export const PALETTE_HEX = Object.fromEntries(
  Object.entries(PALETTE).map(([name, colour]) => [name, toHex(colour)])
) as Record<PaletteName, number>;
