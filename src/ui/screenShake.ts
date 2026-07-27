/**
 * Screen-shake intensities for combat feedback.
 *
 * Pure: the decision of whether and how hard to shake is separated from the
 * Phaser call so it can be unit-tested and tuned in one place. Shake is motion
 * rather than colour, but it is suppressed entirely under the reduced-flash
 * setting, since a player who asked for calmer visuals should not be shaken.
 */

export type ShakeEvent = 'playerDeath' | 'bossDefeat' | 'bossHit' | 'explosion';

export interface ShakeSpec {
  /** Shake duration in milliseconds. */
  duration: number;
  /** Phaser shake intensity, as a fraction of viewport size. */
  intensity: number;
}

/** Weakest to strongest, so the player can feel the difference between events. */
const SHAKE_SPECS: Readonly<Record<ShakeEvent, ShakeSpec>> = {
  bossHit: { duration: 110, intensity: 0.004 },
  explosion: { duration: 140, intensity: 0.006 },
  playerDeath: { duration: 260, intensity: 0.012 },
  bossDefeat: { duration: 420, intensity: 0.017 }
};

/** The shake for an event, or null when it must not shake. */
export function shakeFor(event: ShakeEvent, reducedFlash: boolean): ShakeSpec | null {
  if (reducedFlash) {
    return null;
  }
  return SHAKE_SPECS[event] ?? null;
}
