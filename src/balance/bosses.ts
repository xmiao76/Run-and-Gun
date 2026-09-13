/**
 * Data-driven boss definitions for the first release.
 *
 * The Siege Walker is an original ground machine with three telegraphed attack
 * patterns and a vulnerable phase. The Reactor Warden is an original fortress
 * core with two phases, each gated by destructible subcomponents that must be
 * destroyed before the core becomes vulnerable (PROJECT.md, Bosses).
 * All timing is in seconds so the simulation stays deterministic.
 */

import { GROUND_Y, PLAYER_HEIGHT } from './player';

export type BossId = 'siegeWalker' | 'reactorWarden' | 'ashSentinel';

export type BossPattern = 'stomp' | 'burst' | 'charge' | 'volley';

/**
 * The two heights a `volley` can be fired at, derived from the player's own
 * collision box so each one means something.
 *
 * A standing player occupies `GROUND_Y - PLAYER_HEIGHT` to `GROUND_Y`
 * (448-480); a crouching one `GROUND_Y - CROUCH_HEIGHT` to `GROUND_Y`
 * (460-480). So:
 *   - HIGH sits inside the standing box but above the crouching one: duck.
 *   - LOW sits inside both: the only way over it is a jump.
 * A first draft picked three evenly spaced slots by eye, and two of them
 * passed clean over the player's head - the wall was decorative and only the
 * bottom shot could ever hit. Heights that are computed from the body cannot
 * drift like that.
 */
export const VOLLEY_HIGH_Y = GROUND_Y - PLAYER_HEIGHT + 2;
export const VOLLEY_LOW_Y = GROUND_Y - 12;

/** Heights in fire order; the volley alternates between them. */
export const VOLLEY_HEIGHTS: readonly number[] = [VOLLEY_HIGH_Y, VOLLEY_LOW_Y];

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
  /**
   * Ash Sentinel (Level 3) - a wide, squat artillery platform on short struts.
   *
   * Deliberately a third KIND of fight rather than a third skin:
   *  - the Siege Walker makes you wait: three attacks, then one long window;
   *  - the Reactor Warden makes you disarm it: destroy its nodes to earn a
   *    window at all;
   *  - the Sentinel makes you TRADE. It has no subcomponents and no gate, and
   *    it is vulnerable after every single attack, so the fight is a constant
   *    exchange rather than a wait for permission. It has more health to pay
   *    for those windows.
   *
   * Its signature is the `volley`: a wall of fire with one gap, which is
   * dodged by being in the right place vertically rather than by moving aside
   * or jumping on cue. That is a different reading skill from either of the
   * other two.
   */
  ashSentinel: {
    id: 'ashSentinel',
    name: 'Ash Sentinel',
    health: 14,
    score: 3500,
    width: 76,
    height: 48,
    groundY: 480,
    homeX: 2840,
    // A shorter wind-up than either other boss: the fight is quick exchanges,
    // and a long telegraph would make the rhythm sag.
    telegraphDuration: 0.7,
    attackDuration: 0.6,
    // A short window, but one after EVERY attack.
    //
    // Widened from 1.2s after the eval matrix ran all five weapons at it: at
    // 1.2 the Scatter Blaster and Flare Thrower took roughly three times as
    // long as the Pulse Rifle and died seven times doing it, because a window
    // that short converts a damage-per-second gap into a survival gap. 1.8
    // keeps the trading rhythm while leaving the slower weapons viable.
    vulnerableDuration: 1.8,
    patternsPerCycle: 1,
    patterns: ['volley', 'burst', 'volley', 'charge'],
    burstCount: 4,
    burstSpeed: 230,
    // It repositions rather than rams: slow enough to shoot back at.
    chargeSpeed: 120,
    contactDamage: 1,
    phaseCount: 1,
    phases: []
  },
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
    // 'charge' used to sit here beside a `chargeSpeed` of 0, which made half
    // the Warden's rotation a wind-up followed by nothing at all - it neither
    // moved nor fired. A ground shock suits a floor-mounted core and is dodged
    // by jumping rather than by stepping aside, so the two attacks now ask for
    // different things. The Warden stays static and subcomponent-gated, which
    // is its identity; `chargeSpeed` stays 0 because it is genuinely immobile
    // and no longer claims an attack that needs movement. (TASK-043)
    patterns: ['burst', 'stomp'],
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
