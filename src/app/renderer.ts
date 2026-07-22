import Phaser from 'phaser';
import { isDebugEnabled } from '../debug/debugBridge';

/**
 * Resolves the Phaser renderer type.
 *
 * Real users get `Phaser.AUTO` (WebGL with a Canvas fallback). When the debug
 * bridge is active a `renderer=canvas|webgl` query parameter may override the
 * choice; this lets headless automation, whose software GPU cannot compile the
 * WebGL shaders, run deterministically on the Canvas 2D backend without
 * affecting production.
 */
export function resolveRenderer(): number {
  if (!isDebugEnabled()) {
    return Phaser.AUTO;
  }
  const requested = new URLSearchParams(window.location.search).get('renderer');
  if (requested === 'canvas') {
    return Phaser.CANVAS;
  }
  if (requested === 'webgl') {
    return Phaser.WEBGL;
  }
  return Phaser.AUTO;
}
