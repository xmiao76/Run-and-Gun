/**
 * CRT scanline overlay: the opt-in presentation effect.
 *
 * Implemented as a tiling TileSprite of the `art/scanline` texture, NOT a
 * WebGL post-processing shader. The test and eval harnesses force
 * `?renderer=canvas`, so a shader would be invisible to every automated check
 * while shipping to real users on WebGL - untestable by construction. A
 * TileSprite renders identically under both renderers.
 *
 * The overlay is entirely static: no pulsing, shimmer or animation, so there
 * is nothing for the reduced-flash setting to suppress (a flickering CRT
 * effect would have to honour it; this does not flicker by design).
 */

import Phaser from 'phaser';

import { ensureGameTextures } from '../art/textures';
import { DEFAULT_SETTINGS, type Settings } from '../persistence/schema';

/** Above the HUD (100) and the pause/level overlays (110). */
export const SCANLINE_DEPTH = 200;

/** How strongly the dark rows read. */
const SCANLINE_ALPHA = 0.35;

/**
 * Attach the overlay to a scene, honouring the current setting.
 *
 * Returns a refresh function: call it after the setting changes (the Settings
 * screen does) and the overlay appears or disappears without a scene restart.
 */
export function attachScanlines(scene: Phaser.Scene): () => void {
  ensureGameTextures(scene);
  const overlay = scene.add
    .tileSprite(0, 0, scene.scale.width, scene.scale.height, 'art/scanline')
    .setOrigin(0, 0)
    .setAlpha(SCANLINE_ALPHA)
    .setDepth(SCANLINE_DEPTH);

  const refresh = (): void => {
    const settings = (scene.registry.get('settings') as Settings | undefined) ?? { ...DEFAULT_SETTINGS };
    overlay.setVisible(settings.scanlines === true);
  };
  refresh();
  return refresh;
}
