import { getEnemyDef, type EnemyDef, type EnemyKind } from '../balance/enemies';

/**
 * Deterministic enemy finite-state logic for the Runner and Sentry archetypes.
 *
 * Pure over immutable state: `stepEnemy` returns the next state plus an
 * optional fire intent; the scene owns projectile creation and ids. Every
 * damaging shot is preceded by a readable telegraph (a wind-up state whose
 * duration is data-driven), and a shot is only released when the supplied
 * `canFire` guard (the attack-concurrency cap) permits it.
 */

export type EnemyStateName = 'idle' | 'approach' | 'telegraph' | 'fire' | 'dead';

export interface EnemyState {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  health: number;
  state: EnemyStateName;
  /** Time accumulated in the current state (s). */
  stateTimer: number;
  /** Cooldown until the next attack cycle may begin (s). */
  fireCooldown: number;
  /** -1 left, +1 right; the direction the enemy currently faces. */
  facing: number;
  /** True while in the telegraph wind-up (drives the visual telegraph). */
  telegraphing: boolean;
}

export interface EnemyFireIntent {
  enemyId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
}

export interface EnemyStepResult {
  enemy: EnemyState;
  fireIntent: EnemyFireIntent | null;
}

export function createEnemyState(id: string, kind: EnemyKind, x: number, y: number): EnemyState {
  return {
    id,
    kind,
    x,
    y,
    health: getEnemyDef(kind).health,
    state: 'idle',
    stateTimer: 0,
    fireCooldown: 0,
    facing: 1,
    telegraphing: false
  };
}

export function isAlive(enemy: EnemyState): boolean {
  return enemy.state !== 'dead' && enemy.health > 0;
}

/** Apply one player hit; transitions to `dead` when health reaches zero. */
export function damageEnemy(enemy: EnemyState, amount: number): EnemyState {
  if (!isAlive(enemy)) {
    return enemy;
  }
  const health = enemy.health - amount;
  if (health <= 0) {
    return { ...enemy, health: 0, state: 'dead', telegraphing: false };
  }
  return { ...enemy, health };
}

function distanceToPlayer(enemy: EnemyState, playerX: number): number {
  return Math.abs(playerX - enemy.x);
}

function faceToward(enemy: EnemyState, playerX: number): number {
  if (playerX < enemy.x) {
    return -1;
  }
  if (playerX > enemy.x) {
    return 1;
  }
  return enemy.facing;
}

function fireIntentFor(enemy: EnemyState, def: EnemyDef, playerX: number, playerY: number): EnemyFireIntent {
  const facing = faceToward(enemy, playerX);
  const dx = playerX - enemy.x;
  const dy = playerY - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  // Sentry leads slightly downward toward the player; Runner fires horizontally.
  const vx = enemy.kind === 'sentry' ? (dx / len) * def.projectileSpeed : facing * def.projectileSpeed;
  const vy = enemy.kind === 'sentry' ? (dy / len) * def.projectileSpeed : 0;
  return {
    enemyId: enemy.id,
    x: enemy.x + facing * (def.width / 2),
    y: enemy.y + def.height / 2,
    vx,
    vy,
    damage: def.projectileDamage
  };
}

/**
 * Advance one enemy by `dt` seconds. `canFire` is the attack-concurrency guard:
 * a telegraph may only begin (and thus a shot eventually release) when the
 * scene reports room under the cap.
 */
export function stepEnemy(
  enemy: EnemyState,
  playerX: number,
  playerY: number,
  dt: number,
  canFire: boolean
): EnemyStepResult {
  if (!isAlive(enemy)) {
    return { enemy: { ...enemy, state: 'dead', telegraphing: false }, fireIntent: null };
  }
  const def = getEnemyDef(enemy.kind);
  const dist = distanceToPlayer(enemy, playerX);
  const inRange = dist <= def.engageRange;
  const cooldown = Math.max(0, enemy.fireCooldown - dt);
  let state = enemy.state;
  let stateTimer = enemy.stateTimer + dt;
  let { x } = enemy;
  let facing = faceToward(enemy, playerX);
  let telegraphing = false;
  let fireIntent: EnemyFireIntent | null = null;

  switch (enemy.state) {
    case 'idle':
      if (inRange && cooldown <= 0 && canFire) {
        state = 'telegraph';
        stateTimer = 0;
        telegraphing = true;
      } else if (enemy.kind === 'runner' && dist > def.preferredRange) {
        state = 'approach';
        stateTimer = 0;
      }
      break;
    case 'approach': {
      const dir = playerX < enemy.x ? -1 : 1;
      facing = dir;
      const targetX = playerX - dir * def.preferredRange;
      const stepX = x + dir * def.moveSpeed * dt;
      // Clamp to the hold distance so the runner settles instead of oscillating.
      x = dir > 0 ? Math.min(stepX, targetX) : Math.max(stepX, targetX);
      if (inRange && cooldown <= 0 && canFire) {
        state = 'telegraph';
        stateTimer = 0;
        telegraphing = true;
      } else if (dist <= def.preferredRange) {
        state = 'idle';
        stateTimer = 0;
      }
      break;
    }
    case 'telegraph':
      telegraphing = true;
      facing = faceToward(enemy, playerX);
      if (stateTimer >= def.telegraphDuration) {
        state = 'fire';
        stateTimer = 0;
        telegraphing = false;
        fireIntent = fireIntentFor({ ...enemy, x, facing }, def, playerX, playerY);
      }
      break;
    case 'fire':
      // The shot was released on entry; settle back into a combat stance.
      state = enemy.kind === 'runner' ? 'approach' : 'idle';
      stateTimer = 0;
      break;
    default:
      break;
  }

  const nextFireCooldown = state === 'fire' ? def.fireInterval : cooldown;

  return {
    enemy: {
      ...enemy,
      x,
      facing,
      state,
      stateTimer,
      telegraphing,
      fireCooldown: nextFireCooldown
    },
    fireIntent
  };
}
