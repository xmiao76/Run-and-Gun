/**
 * Health, invulnerability, and life-loss rules.
 *
 * Pure over immutable state. Invulnerability is a simulation-time window that
 * blocks repeated damage; running out of lives yields game over.
 */

export interface HealthState {
  lives: number;
  /** Remaining invulnerability time (s); > 0 means damage is ignored. */
  invuln: number;
  /** True once lives reach zero. */
  gameOver: boolean;
}

export function createHealthState(lives: number): HealthState {
  return { lives, invuln: 0, gameOver: false };
}

export function isInvulnerable(state: HealthState): boolean {
  return state.invuln > 0;
}

/** Tick the invulnerability window down by `dt` seconds (clamped at zero). */
export function tickInvuln(state: HealthState, dt: number): HealthState {
  if (state.invuln <= 0) {
    return state;
  }
  return { ...state, invuln: Math.max(0, state.invuln - dt) };
}

export interface DamageResult {
  health: HealthState;
  /** True when this call actually removed a life (was not blocked). */
  applied: boolean;
}

/**
 * Take a life outright, ignoring any open invulnerability window.
 *
 * This is the pit / lethal-hazard path. Mercy invincibility exists so that one
 * projectile hit does not immediately become several; falling out of the world
 * is not damage for it to absorb. The respawn runs either way, so letting the
 * window swallow the life loss turned a pit into a free teleport back to the
 * last checkpoint - take a hit, drop into a pit, and the fall cost nothing.
 *
 * Still a no-op once the run is over, so a death cannot be counted twice.
 */
export function applyLethalDamage(state: HealthState, invulnDuration: number): DamageResult {
  if (state.gameOver) {
    return { health: state, applied: false };
  }
  const lives = state.lives - 1;
  if (lives <= 0) {
    return { health: { lives: 0, invuln: 0, gameOver: true }, applied: true };
  }
  return { health: { lives, invuln: invulnDuration, gameOver: false }, applied: true };
}

/**
 * Apply one damaging hit. Blocked while invulnerable or after game over.
 * Otherwise decrements a life, starts a fresh invulnerability window, and may
 * trigger game over when the last life is lost.
 */
export function applyDamage(state: HealthState, invulnDuration: number): DamageResult {
  if (state.invuln > 0) {
    return { health: state, applied: false };
  }
  return applyLethalDamage(state, invulnDuration);
}

/** Restore full health and a fresh invulnerability window (e.g. on respawn). */
export function restoreWithInvuln(lives: number, invulnDuration: number): HealthState {
  return { lives, invuln: invulnDuration, gameOver: false };
}
