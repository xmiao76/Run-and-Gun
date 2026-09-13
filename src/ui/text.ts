/**
 * Arcade text: one place that draws every string in the game.
 *
 * The game used the system `monospace` font at 38 call sites, which is the
 * loudest thing telling a player this is a web page rather than an arcade
 * cabinet. `drawText` replaces those with the original pixel font in
 * `src/art/font.ts`, rendered through Phaser's RetroFont - a bitmap font built
 * from a texture, so no font file is shipped (ASSET_POLICY.md).
 *
 * Callers keep passing the colours and sizes they always did: a size in pixels
 * becomes an integer glyph scale, and a colour becomes a tint on white glyphs.
 * Keeping the same call shape is what makes this a presentation change rather
 * than a rewrite of every scene.
 */

import Phaser from 'phaser';

import { CHARS_PER_ROW, FONT_CHARS, FONT_SHEET, GLYPH_H, GLYPH_W } from '../art/font';
import { parsePixelArt } from '../art/pixelArt';
import { gridToCanvas } from '../art/textures';

/** Texture holding the glyph grid. */
export const FONT_TEXTURE = 'art/font-sheet';
/** Key the parsed bitmap font is registered under. */
export const FONT_KEY = 'arcade';

/** Nominal design size of one glyph cell at scale 1. */
export const FONT_BASE_SIZE = GLYPH_H;

export interface DrawTextOptions {
  /** Requested pixel height; rounded down to a whole glyph scale. */
  size?: number;
  /** CSS colour, applied as a tint to the white glyphs. */
  color?: string;
  /** 0 left, 0.5 centred, 1 right - matches setOrigin. */
  originX?: number;
  originY?: number;
  /** Render depth, as scenes already use. */
  depth?: number;
}

/**
 * Convert a requested pixel height into a whole-number glyph scale.
 *
 * Fractional scaling is what makes pixel art look mushy, so a request is
 * rounded down to an integer multiple and never below 1. A 52 px heading
 * becomes scale 6 (48 px) rather than 6.5.
 */
export function glyphScale(size: number | undefined): number {
  if (size === undefined || !Number.isFinite(size)) {
    return 2;
  }
  return Math.max(1, Math.floor(size / FONT_BASE_SIZE));
}

/** Strip characters the font cannot draw, so a stray glyph never renders blank-but-spaced. */
export function sanitize(text: string): string {
  const upper = text.toUpperCase();
  let out = '';
  for (const char of upper) {
    out += FONT_CHARS.includes(char) ? char : ' ';
  }
  return out;
}

/**
 * Register the font texture and parse it into the bitmap-font cache.
 *
 * Idempotent, like `ensureGameTextures`, so scenes call it unconditionally in
 * `create()`.
 */
export function ensureFont(scene: Phaser.Scene): void {
  if (!scene.textures.exists(FONT_TEXTURE)) {
    scene.textures.addCanvas(FONT_TEXTURE, gridToCanvas(parsePixelArt(FONT_SHEET)));
  }
  if (!scene.cache.bitmapFont.exists(FONT_KEY)) {
    const data = Phaser.GameObjects.RetroFont.Parse(scene, {
      image: FONT_TEXTURE,
      width: GLYPH_W,
      height: GLYPH_H,
      chars: FONT_CHARS,
      charsPerRow: CHARS_PER_ROW,
      // The config uses dotted keys, not nested objects.
      'offset.x': 0,
      'offset.y': 0,
      'spacing.x': 0,
      'spacing.y': 0,
      lineSpacing: 2
    });
    if (data) {
      scene.cache.bitmapFont.add(FONT_KEY, data);
    }
  }
}

/**
 * Draw a string in the arcade font.
 *
 * Returns the BitmapText so callers can keep it and call `setText` later,
 * exactly as they did with the Text objects this replaces.
 */
export function drawText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options: DrawTextOptions = {}
): Phaser.GameObjects.BitmapText {
  ensureFont(scene);
  const scale = glyphScale(options.size);
  const label = scene.add.bitmapText(x, y, FONT_KEY, sanitize(text), FONT_BASE_SIZE * scale);
  label.setOrigin(options.originX ?? 0, options.originY ?? 0);
  if (options.color) {
    label.setTint(Phaser.Display.Color.HexStringToColor(options.color).color);
  }
  if (options.depth !== undefined) {
    label.setDepth(options.depth);
  }
  return label;
}

/** Update a label's text, applying the same sanitising as `drawText`. */
export function setText(label: Phaser.GameObjects.BitmapText, text: string): void {
  label.setText(sanitize(text));
}
