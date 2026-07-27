/**
 * How the HUD presents a life count.
 *
 * A row of icons reads instantly at arcade life counts, but 30 icons would run
 * across the screen and collide with the rest of the HUD. Past a small threshold
 * the row collapses to a single icon plus a multiplier. Pure, so the rule is
 * unit-testable without a scene.
 */

/** Most icons drawn before collapsing to "icon xN". */
export const MAX_LIFE_ICONS = 5;

export interface LifeHudLayout {
  /** Number of life icons to show. */
  icons: number;
  /** Multiplier label, or null when the icons alone convey the count. */
  countLabel: string | null;
}

export function lifeHudLayout(lives: number): LifeHudLayout {
  const safe = Number.isFinite(lives) ? Math.max(0, Math.floor(lives)) : 0;
  if (safe <= MAX_LIFE_ICONS) {
    return { icons: safe, countLabel: null };
  }
  return { icons: 1, countLabel: 'x' + safe };
}
