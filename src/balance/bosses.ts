/**
 * Data-driven boss definitions for the first release.
 *
 * The Siege Walker is an original ground machine with three telegraphed attack
 * patterns and a vulnerable phase (GAME_REQUIREMENTS.md section 7). All timing
 * is in seconds so the simulation stays deterministic.
 */

export type BossId = 'siegeWalker';

export type BossPattern = 'stomp' | 'burst' | 'charge';

export interface BossDef {
  id: BossId;
  name: string;
  health: number;
  score: number;
  width: number;
  height: number;
  /** Ground y the boss stands on (its top = groundY - height). */
  groundY: number;
  /** Home x the boss returns to / charges from. */
  homeX: number;
  /** Readable wind-up before a pattern executes (s). */
  telegraphDuration: number;
  /** Time a pattern spends resolving before the next decision (s). */
  attackDuration: number;
  /** Vulnerable-window length after every patternsPerCycle attacks (s). */
  vulnerableDuration: number;
  /** Attacks between vulnerable windows. */
  patternsPerCycle: number;
  /** Pattern rotation, in order. */
  patterns: readonly BossPattern[];
  /** Burst pattern: projectile count and speed. */
  burstCount: number;
  burstSpeed: number;
  /** Charge pattern: dash speed (px/s). */
  chargeSpeed: number;
  /** Damage the boss's hazards/projectiles deal to the player. */
  contactDamage: number;
}

export const BOSS_DEFS: Record<BossId, BossDef> = {
  siegeWalker: {
    id: 'siegeWalker',
    name: 'Siege Walker',
    health: 12,
    score: 2000,
    width: 64,
    height: 56,
    groundY: 480,
    homeX: 2820,
    telegraphDuration: 0.9,
    attackDuration: 0.8,
    vulnerableDuration: 2.2,
    patternsPerCycle: 3,
    patterns: ['stomp', 'burst', 'charge'],
    burstCount: 3,
    burstSpeed: 220,
    chargeSpeed: 260,
    contactDamage: 1
  }
};

export function getBossDef(id: BossId): BossDef {
  return BOSS_DEFS[id];
}
