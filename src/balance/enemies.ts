/**
 * Data-driven enemy archetype definitions for the first release.
 *
 * Balance values live here; the finite-state behaviour that consumes them is in
 * `src/simulation/enemies.ts`. Only the original Runner and Sentry archetypes
 * are introduced in M2 (GAME_REQUIREMENTS.md section 6).
 */

export type EnemyKind = 'runner' | 'sentry';

export interface EnemyDef {
  kind: EnemyKind;
  /** Original display name. */
  name: string;
  /** Hits required to destroy the enemy. */
  health: number;
  /** Score awarded on destruction. */
  score: number;
  /** Horizontal move speed while approaching (px/s); 0 for stationary types. */
  moveSpeed: number;
  /** Distance to the player at which the enemy engages / fires (px). */
  engageRange: number;
  /** Distance the Runner tries to hold from the player (px). */
  preferredRange: number;
  /** Readable wind-up time before a shot is released (s) - the telegraph. */
  telegraphDuration: number;
  /** Minimum idle time between shots (s). */
  fireInterval: number;
  /** Speed of the enemy's projectile (px/s). */
  projectileSpeed: number;
  /** Lifetime of the enemy's projectile (s). */
  projectileLifetime: number;
  /** Damage dealt to the player per hit. */
  projectileDamage: number;
  /** Collision half-extents for the body (px). */
  width: number;
  height: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  runner: {
    kind: 'runner',
    name: 'Runner',
    health: 2,
    score: 100,
    moveSpeed: 95,
    engageRange: 300,
    preferredRange: 132,
    telegraphDuration: 0.45,
    fireInterval: 1.1,
    projectileSpeed: 250,
    projectileLifetime: 2.2,
    projectileDamage: 1,
    width: 20,
    height: 30
  },
  sentry: {
    kind: 'sentry',
    name: 'Sentry',
    health: 3,
    score: 150,
    moveSpeed: 0,
    engageRange: 360,
    preferredRange: 360,
    telegraphDuration: 0.7,
    fireInterval: 1.6,
    projectileSpeed: 300,
    projectileLifetime: 2.4,
    projectileDamage: 1,
    width: 24,
    height: 24
  }
};

export function getEnemyDef(kind: EnemyKind): EnemyDef {
  return ENEMY_DEFS[kind];
}
