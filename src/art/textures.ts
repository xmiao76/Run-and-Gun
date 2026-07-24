/**
 * Compiles the pixel-art sprite sheet (sprites.ts) into Phaser canvas
 * textures and builds the few procedural backgrounds (sky gradient) that are
 * smoother than 1px art allows. Idempotent: safe to call from every scene's
 * create(); existing textures are left alone.
 */

import Phaser from 'phaser';

import { parsePixelArt, type PixelGrid } from './pixelArt';
import { SPRITE_SPECS, type SpriteKey } from './sprites';

/** Texture key for the vertical dusk-sky gradient (not pixel art). */
export const SKY_TEXTURE = 'art/bg-sky';

/** Sky gradient stops, top to bottom: dusk over a jungle war zone. */
const SKY_STOPS: readonly { at: number; color: string }[] = [
  { at: 0, color: '#141f33' },
  { at: 0.55, color: '#274060' },
  { at: 0.85, color: '#3f5e58' },
  { at: 1, color: '#c96f3b' }
];

function gridToCanvas(grid: PixelGrid): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = grid.width;
  canvas.height = grid.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d canvas context unavailable for texture generation');
  }
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const color = grid.pixels[y * grid.width + x];
      if (color === null || color === undefined) {
        continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

function skyCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d canvas context unavailable for sky generation');
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  for (const stop of SKY_STOPS) {
    gradient.addColorStop(stop.at, stop.color);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

/**
 * Registers every sprite texture and the sky gradient with the game's texture
 * manager. Textures that already exist are skipped, so scenes can call this
 * unconditionally during create().
 */
export function ensureGameTextures(scene: Phaser.Scene): void {
  for (const key of Object.keys(SPRITE_SPECS) as SpriteKey[]) {
    if (scene.textures.exists(key)) {
      continue;
    }
    const grid = parsePixelArt(SPRITE_SPECS[key]);
    scene.textures.addCanvas(key, gridToCanvas(grid));
  }
  if (!scene.textures.exists(SKY_TEXTURE)) {
    // 16px wide is enough for a horizontal-uniform gradient; it is stretched.
    scene.textures.addCanvas(SKY_TEXTURE, skyCanvas(16, 256));
  }
}
