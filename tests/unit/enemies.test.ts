import { describe, expect, it } from 'vitest';
import { getEnemyDef } from '../../src/balance/enemies';
import {
  createEnemyState,
  damageEnemy,
  isAlive,
  stepEnemy
} from '../../src/simulation/enemies';

const FIXED_DT = 1 / 60;

function step(e: ReturnType<typeof createEnemyState>, px: number, py: number, canFire: boolean, n = 1) {
  let enemy = e;
  let intent = null;
  for (let i = 0; i < n; i++) {
    const r = stepEnemy(enemy, px, py, FIXED_DT, canFire);
    enemy = r.enemy;
    if (r.fireIntent) {
      intent = r.fireIntent;
    }
  }
  return { enemy, intent };
}

describe('Runner finite-state behaviour', () => {
  it('approaches when the player is far and holds near the preferred range', () => {
    const def = getEnemyDef('runner');
    const e = createEnemyState('r1', 'runner', 100, 450);
    const far = step(e, 100 + def.engageRange + 200, 450, true);
    expect(far.enemy.state).toBe('approach');

    const startX = far.enemy.x;
    const moved = step(far.enemy, startX + 1000, 450, true, 60);
    expect(moved.enemy.x).toBeGreaterThan(startX);
    expect(moved.enemy.facing).toBe(1);
  });

  it('telegraphs before firing and the telegraph lasts the configured duration', () => {
    const def = getEnemyDef('runner');
    const e = createEnemyState('r1', 'runner', 300, 450);
    const playerX = 300 + def.preferredRange; // in range
    const tele = step(e, playerX, 450, true);
    expect(tele.enemy.state).toBe('telegraph');
    expect(tele.enemy.telegraphing).toBe(true);
    expect(tele.intent).toBeNull();

    const telegraphSteps = Math.ceil(def.telegraphDuration / FIXED_DT);
    const stillTele = step(tele.enemy, playerX, 450, true, telegraphSteps - 1);
    expect(stillTele.enemy.telegraphing).toBe(true);
    expect(stillTele.intent).toBeNull();
  });

  it('releases exactly one shot after the wind-up and resets the fire cooldown', () => {
    const def = getEnemyDef('runner');
    const e = createEnemyState('r1', 'runner', 300, 450);
    const playerX = 300 + def.preferredRange; // idle + in range -> telegraph on step 1
    const tele = step(e, playerX, 450, true);
    expect(tele.enemy.state).toBe('telegraph');

    const telegraphSteps = Math.ceil(def.telegraphDuration / FIXED_DT);
    // The intent is emitted on the step the wind-up elapses (telegraph -> fire).
    const fired = step(tele.enemy, playerX, 450, true, telegraphSteps + 1);
    expect(fired.intent).not.toBeNull();
    expect(fired.intent?.enemyId).toBe('r1');
    expect(fired.enemy.fireCooldown).toBeCloseTo(def.fireInterval);
    // The shot aims horizontally toward the player.
    expect(fired.intent?.vy).toBe(0);
    expect(fired.intent?.vx).toBeGreaterThan(0);
  });

  it('does not begin a telegraph while the concurrency guard denies it', () => {
    const def = getEnemyDef('runner');
    const e = createEnemyState('r1', 'runner', 300, 450);
    const playerX = 300 + def.preferredRange;
    const denied = step(e, playerX, 450, false);
    expect(denied.enemy.state).not.toBe('telegraph');
    expect(denied.enemy.telegraphing).toBe(false);
  });
});

describe('Sentry behaviour', () => {
  it('stays stationary and only engages within range', () => {
    const def = getEnemyDef('sentry');
    const e = createEnemyState('s1', 'sentry', 500, 450);
    const idle = step(e, 500 + def.engageRange + 100, 450, true);
    expect(idle.enemy.state).toBe('idle');
    expect(idle.enemy.x).toBe(500);

    const tele = step(e, 500 + def.engageRange - 10, 450, true);
    expect(tele.enemy.state).toBe('telegraph');
    expect(tele.enemy.x).toBe(500);
  });

  it('leads its shot toward the player position (diagonal when offset vertically)', () => {
    const def = getEnemyDef('sentry');
    const e = createEnemyState('s1', 'sentry', 500, 450);
    const playerX = 500 + 100;
    const playerY = 350;
    const tele = step(e, playerX, playerY, true);
    expect(tele.enemy.state).toBe('telegraph');

    const telegraphSteps = Math.ceil(def.telegraphDuration / FIXED_DT);
    const fired = step(tele.enemy, playerX, playerY, true, telegraphSteps + 1);
    expect(fired.intent).not.toBeNull();
    expect(fired.intent?.vx).toBeGreaterThan(0);
    expect(fired.intent?.vy).toBeLessThan(0);
  });
});

describe('enemy damage and death', () => {
  it('takes hits and dies exactly once at zero health', () => {
    const def = getEnemyDef('runner');
    let e = createEnemyState('r1', 'runner', 100, 450);
    e = damageEnemy(e, 1);
    expect(isAlive(e)).toBe(true);
    expect(e.health).toBe(def.health - 1);
    e = damageEnemy(e, 1);
    expect(isAlive(e)).toBe(false);
    expect(e.state).toBe('dead');
    // Further damage on a dead enemy is a no-op.
    expect(damageEnemy(e, 5).health).toBe(0);
  });
});
