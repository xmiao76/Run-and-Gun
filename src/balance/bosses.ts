/**
 * Data-driven boss definitions for the first release.
 *
 * The Siege Walker is an original ground machine with three telegraphed attack
 * patterns and a vulnerable phase. The Reactor Warden is an original fortress
 * core with two phases, each gated by destructible subcomponents that must be
 * destroyed before the core becomes vulnerable (GAME_REQUIREMENTS.md section 7).
 * All timing is in seconds so the simulation stays deterministic.
 */

export type BossId = 'siegeWalker' | 'reactorWarden';

export type BossPattern = 'stomp' | 'burst' | 'charge';

/** A destructible subcomponent (e.g. a turret/shield node) within a boss phase. */
export interface BossSubcomponentDef {
  id: string;
  /** Offset from the boss top-left when the phase starts. */
  dx: number;
  dy: number;
  width: number;
  height: number;
  health: number;
  /** Score awarded when destroyed. */
  score: number;
}

export interface BossPhaseDef {
  /** Subcomponents that must all be destroyed to unlock the vulnerable window. */
  subcomponents: BossSubcomponentDef[];
}

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
  /** Vulnerable-window length after a phase's subcomponents are cleared (s). */
  vulnerableDuration: number;
  /** Attacks between vulnerable windows within a phase (0 = vulnerable only via subcomponents). */
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
  /** Number of phases; bosses without subcomponents use a single implicit phase. */
  phaseCount: number;
  /** Per-phase subcomponent layout; empty for bosses without destructible parts. */
  phases: readonly BossPhaseDef[];
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
    contactDamage: 1,
    phaseCount: 1,
    phases: []
  },
  reactorWarden: {
    id: 'reactorWarden',
    name: 'Reactor Warden',
    health: 8,
    score: 3000,
    width: 72,
    height: 72,
    groundY: 480,
    homeX: 2820,
    telegraphDuration: 0.8,
    attackDuration: 0.7,
    vulnerableDuration: 2.0,
    patternsPerCycle: 2,
    patterns: ['burst', 'charge'],
    burstCount: 4,
    burstSpeed: 240,
    chargeSpeed: 0,
    contactDamage: 1,
    phaseCount: 2,
    phases: [
      {
        subcomponents: [
          { id: 'rw-p1-a', dx: -28, dy: 8, width: 18, height: 18, health: 2, score: 300 },
          { id: 'rw-p1-b', dx: 82, dy: 8, width: 18, height: 18, health: 2, score: 300 }
        ]
      },
      {
        subcomponents: [
          { id: 'rw-p2-a', dx: -28, dy: 44, width: 18, height: 18, health: 2, score: 300 },
          { id: 'rw-p2-b', dx: 82, dy: 44, width: 18, height: 18, health: 2, score: 300 }
        ]
      }
    ]
  }
};

export function getBossDef(id: BossId): BossDef {
  return BOSS_DEFS[id];
}
