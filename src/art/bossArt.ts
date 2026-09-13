/**
 * Boss presentation helpers: pure mappings from boss id to sprite frame.
 *
 * Both bosses have a two-frame idle derived from the authored base frame (see
 * `liftAlternateFeet` / `pulseRows` in art/sprites.ts). Like the enemy frames,
 * the choice is a function of simulation step only, so it is deterministic
 * under the manual clock and frozen while paused.
 */

import type { BossId } from '../balance/bosses';

/** Simulation steps per boss idle frame (30 steps = half a second). */
export const BOSS_FRAME_STEPS = 30;

/** Body sprite for a boss's A (rest) frame; kept for compatibility. */
export function bossTexture(id: BossId): string {
  switch (id) {
    case 'siegeWalker':
      return 'art/boss-siege-walker';
    case 'reactorWarden':
      return 'art/boss-reactor-warden';
    case 'ashSentinel':
      return 'art/boss-ash-sentinel';
  }
}

/** The idle frame a living boss shows this step. */
export function bossFrame(id: BossId, stepIndex: number): string {
  const base = bossTexture(id);
  return Math.floor(stepIndex / BOSS_FRAME_STEPS) % 2 === 0 ? base : base + '-b';
}
