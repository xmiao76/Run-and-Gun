import { getEnemyDef, type EnemyDef, type EnemyKind } from '../balance/enemies';
import { repositionDir } from './enemyReposition';

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
  /** Spawn/anchor point used by aerial patrols and as a home position. */
  originX: number;
  originY: number;
  /** Monotonic patrol clock for bounded aerial movement (s). */
  patrolTime: number;
}

export interface EnemyFireIntent {
  enemyId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  /** Gravity applied to this projectile (px/s^2); 0 for straight shots. */
  arcGravity: number;
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
    telegraphing: false,
    originX: x,
    originY: y,
    patrolTime: 0
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
  let vx: number;
  let vy: number;
  if (enemy.kind === 'sentry') {
    // Leads straight toward the player.
    vx = (dx / len) * def.projectileSpeed;
    vy = (dy / len) * def.projectileSpeed;
  } else if (enemy.kind === 'drone') {
    // Fires downward with a slight horizontal lead - a readable aerial shot.
    vx = Math.sign(dx || facing) * def.projectileSpeed * 0.35;
    vy = def.projectileSpeed * 0.94;
  } else if (enemy.kind === 'grenadier') {
    // Lobs an arcing projectile toward the player's horizontal position.
    vx = Math.sign(dx || facing) * def.projectileSpeed * 0.7;
    vy = -def.projectileSpeed * 0.72;
  } else {
    vx = facing * def.projectileSpeed;
    vy = 0;
  }
  return {
    enemyId: enemy.id,
    x: enemy.x + facing * (def.width / 2),
    y: enemy.y + def.height / 2,
    vx,
    vy,
    damage: def.projectileDamage,
    arcGravity: def.arcGravity
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
  let y = enemy.y;
  let facing = faceToward(enemy, playerX);
  let telegraphing = false;
  const patrolTime = enemy.patrolTime + dt;
  let fireIntent: EnemyFireIntent | null = null;

  const startTelegraph = (): void => {
    state = 'telegraph';
    stateTimer = 0;
    telegraphing = true;
  };

  switch (enemy.state) {
    case 'idle':
      if (inRange && cooldown <= 0 && canFire) {
        startTelegraph();
      } else if (enemy.kind === 'runner' && dist > def.preferredRange) {
        state = 'approach';
        stateTimer = 0;
      } else if (enemy.kind === 'grenadier') {
        // Keep distance from idle: back away (opposite the player) when too
        // close, close in (toward the player) when too far.
        const tooClose = dist < def.preferredRange - 24;
        const tooFar = dist > def.preferredRange + 24;
        // Reposition along the horizontal axis to hold the preferred range.
        // Back away from the player when too close; close in when too far.
        const dir = repositionDir(tooClose, tooFar, x, playerX);
        if (dir !== 0) {
          facing = dir;
          x += dir * def.moveSpeed * dt;
        }
      }
      break;
    case 'approach': {
      if (enemy.kind === 'runner') {
        const dir = playerX < x ? -1 : 1;
        facing = dir;
        const targetX = playerX - dir * def.preferredRange;
        const stepX = x + dir * def.moveSpeed * dt;
        x = dir > 0 ? Math.min(stepX, targetX) : Math.max(stepX, targetX);
        if (inRange && cooldown <= 0 && canFire) {
          startTelegraph();
        } else if (dist <= def.preferredRange) {
          state = 'idle';
          stateTimer = 0;
        }
      } else if (inRange && cooldown <= 0 && canFire) {
        startTelegraph();
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
      state = enemy.kind === 'runner' ? 'approach' : 'idle';
      stateTimer = 0;
      break;
    default:
      break;
  }

  // Aerial patrol: bounded horizontal oscillation about the anchor (always on).
  if (def.aerial) {
    x = enemy.originX + Math.sin(patrolTime * def.patrolSpeed) * def.patrolAmplitude;
    y = enemy.originY;
    facing = faceToward({ ...enemy, x }, playerX);
  }

  const nextFireCooldown = state === 'fire' ? def.fireInterval : cooldown;

  return {
    enemy: {
      ...enemy,
      x,
      y,
      facing,
      state,
      stateTimer,
      telegraphing,
      patrolTime,
      fireCooldown: nextFireCooldown
    },
    fireIntent
  };
}
