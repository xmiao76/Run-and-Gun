/**
 * Data-driven enemy archetype definitions for the first release.
 *
 * Balance values live here; the finite-state behaviour that consumes them is in
 * `src/simulation/enemies.ts`. All four regular archetypes are original
 * (GAME_REQUIREMENTS.md section 6): Runner + Sentry (M2), Drone + Grenadier
 * (M3).
 */

export type EnemyKind = 'runner' | 'sentry' | 'drone' | 'grenadier';

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
  /** Distance the enemy tries to hold from the player (px). */
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
  /** Gravity applied to the projectile (px/s^2); > 0 for arcing shots. */
  arcGravity: number;
  /** True for aerial types that follow a bounded patrol path. */
  aerial: boolean;
  /** Aerial patrol: horizontal amplitude (px) and angular speed (rad/s). */
  patrolAmplitude: number;
  patrolSpeed: number;
  /** Collision extents for the body (px). */
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
    arcGravity: 0,
    aerial: false,
    patrolAmplitude: 0,
    patrolSpeed: 0,
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
    arcGravity: 0,
    aerial: false,
    patrolAmplitude: 0,
    patrolSpeed: 0,
    width: 24,
    height: 24
  },
  drone: {
    kind: 'drone',
    name: 'Drone',
    health: 2,
    score: 120,
    moveSpeed: 70,
    engageRange: 240,
    preferredRange: 150,
    telegraphDuration: 0.5,
    fireInterval: 1.4,
    projectileSpeed: 240,
    projectileLifetime: 2.0,
    projectileDamage: 1,
    arcGravity: 0,
    aerial: true,
    patrolAmplitude: 70,
    patrolSpeed: 1.6,
    width: 22,
    height: 18
  },
  grenadier: {
    kind: 'grenadier',
    name: 'Grenadier',
    health: 3,
    score: 140,
    moveSpeed: 70,
    engageRange: 340,
    preferredRange: 230,
    telegraphDuration: 0.6,
    fireInterval: 1.8,
    projectileSpeed: 280,
    projectileLifetime: 2.6,
    projectileDamage: 1,
    arcGravity: 760,
    aerial: false,
    patrolAmplitude: 0,
    patrolSpeed: 0,
    width: 22,
    height: 30
  }
};

export function getEnemyDef(kind: EnemyKind): EnemyDef {
  return ENEMY_DEFS[kind];
}
