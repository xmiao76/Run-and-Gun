import { getBossDef, type BossDef, type BossId, type BossPattern } from '../balance/bosses';

/**
 * Deterministic boss finite-state logic for the Siege Walker.
 *
 * Pure over immutable state. The boss cycles through three telegraphed attack
 * patterns and, after every `patternsPerCycle` attacks, enters a vulnerable
 * window during which it can take damage; otherwise it is immune. Every state
 * is time-bounded, so phase transitions cannot deadlock (G3), and health
 * reaches zero exactly once (G4). The scene converts action intents into
 * hazards/projectiles/movement.
 */

export type BossStateName = 'enter' | 'idle' | 'telegraph' | 'attack' | 'vulnerable' | 'dead';

export interface BossState {
  id: BossId;
  x: number;
  y: number;
  health: number;
  state: BossStateName;
  stateTimer: number;
  /** Index into the def's pattern rotation. */
  patternIndex: number;
  /** Attacks completed in the current cycle (toward the next vulnerable window). */
  attacksInCycle: number;
  /** True while the boss can be damaged. */
  vulnerable: boolean;
  facing: number;
  /** True while a telegraph wind-up is showing. */
  telegraphing: boolean;
  /** True once the boss has been activated by the arena trigger. */
  active: boolean;
}

export type BossActionKind = 'shockwave' | 'burst' | 'none';

export interface BossActionIntent {
  kind: BossActionKind;
  /** World-space origin of the action. */
  x: number;
  y: number;
  /** For burst: target position to aim the spread at. */
  targetX?: number;
  targetY?: number;
}

export interface BossStepResult {
  boss: BossState;
  action: BossActionIntent;
  /** True on the step the boss transitions to dead. */
  justDied: boolean;
}

export function createBossState(id: BossId): BossState {
  const def = getBossDef(id);
  return {
    id,
    x: def.homeX,
    y: def.groundY - def.height,
    health: def.health,
    state: 'enter',
    stateTimer: 0,
    patternIndex: 0,
    attacksInCycle: 0,
    vulnerable: false,
    facing: -1,
    telegraphing: false,
    active: false
  };
}

export function isBossAlive(boss: BossState): boolean {
  return boss.state !== 'dead' && boss.health > 0;
}

export function currentPattern(boss: BossState, def: BossDef): BossPattern {
  return def.patterns[boss.patternIndex % def.patterns.length];
}

/** Activate the boss when the player enters the arena (idempotent). */
export function activateBoss(boss: BossState): BossState {
  if (boss.active || !isBossAlive(boss)) {
    return boss;
  }
  return { ...boss, active: true, state: 'enter', stateTimer: 0 };
}

/**
 * Apply damage; only counts while vulnerable and alive. Returns the new state
 * and whether the hit was effective.
 */
export function damageBoss(boss: BossState, amount: number): { boss: BossState; applied: boolean } {
  if (!isBossAlive(boss) || !boss.vulnerable) {
    return { boss, applied: false };
  }
  const health = boss.health - amount;
  if (health <= 0) {
    return { boss: { ...boss, health: 0, state: 'dead', vulnerable: false, telegraphing: false }, applied: true };
  }
  return { boss: { ...boss, health }, applied: true };
}

/** Advance the boss by `dt`. Movement during a charge is applied by the scene via the returned state's x. */
export function stepBoss(boss: BossState, playerX: number, playerY: number, dt: number): BossStepResult {
  if (!boss.active) {
    return { boss, action: { kind: 'none', x: boss.x, y: boss.y }, justDied: false };
  }
  if (!isBossAlive(boss)) {
    return { boss: { ...boss, state: 'dead', vulnerable: false, telegraphing: false }, action: { kind: 'none', x: boss.x, y: boss.y }, justDied: false };
  }
  const def = getBossDef(boss.id);
  const stateTimer = boss.stateTimer + dt;
  let { state } = boss;
  let { patternIndex } = boss;
  let attacksInCycle = boss.attacksInCycle;
  let vulnerable = false;
  let telegraphing = false;
  let { x } = boss;
  const facing = playerX < x ? -1 : 1;
  let action: BossActionIntent = { kind: 'none', x, y: boss.y };
  let justDied = false;
  const nextStateTimer = 0;
  let carryTimer = stateTimer;

  switch (boss.state) {
    case 'enter':
      if (stateTimer >= 0.6) {
        state = 'idle';
        carryTimer = nextStateTimer;
      }
      break;
    case 'idle':
      if (stateTimer >= 0.3) {
        state = 'telegraph';
        carryTimer = nextStateTimer;
        telegraphing = true;
      }
      break;
    case 'telegraph':
      telegraphing = true;
      if (stateTimer >= def.telegraphDuration) {
        state = 'attack';
        carryTimer = nextStateTimer;
        const pattern = currentPattern(boss, def);
        if (pattern === 'stomp') {
          action = { kind: 'shockwave', x, y: def.groundY };
        } else if (pattern === 'burst') {
          action = { kind: 'burst', x, y: boss.y + def.height / 2, targetX: playerX, targetY: playerY };
        }
      }
      break;
    case 'attack':
      if (currentPattern(boss, def) === 'charge') {
        x += facing * def.chargeSpeed * dt;
        const limit = facing < 0 ? def.homeX - 220 : def.homeX + 40;
        x = facing < 0 ? Math.max(x, limit) : Math.min(x, limit);
      }
      if (stateTimer >= def.attackDuration) {
        attacksInCycle += 1;
        if (attacksInCycle >= def.patternsPerCycle) {
          state = 'vulnerable';
          attacksInCycle = 0;
        } else {
          patternIndex += 1;
          state = 'idle';
          x = def.homeX; // reposition after a non-charge attack
        }
        carryTimer = nextStateTimer;
      }
      break;
    case 'vulnerable':
      vulnerable = true;
      if (stateTimer >= def.vulnerableDuration) {
        state = 'idle';
        carryTimer = nextStateTimer;
        x = def.homeX;
      }
      break;
    default:
      break;
  }

  const next: BossState = {
    ...boss,
    x,
    facing,
    state,
    stateTimer: carryTimer,
    patternIndex,
    attacksInCycle,
    vulnerable,
    telegraphing,
    active: true
  };

  if (next.health <= 0 && boss.state !== 'dead') {
    justDied = true;
  }

  return { boss: next, action, justDied };
}
