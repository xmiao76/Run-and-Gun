import { describe, expect, it } from 'vitest';
import { createEnemyState, stepEnemy } from '../../src/simulation/enemies';

const DT = 1 / 60;

describe('Drone aerial patrol', () => {
  it('oscillates about its anchor and holds altitude', () => {
    let e = createEnemyState('d1', 'drone', 800, 300);
    // A quarter period of the patrol sine moves the drone by +amplitude.
    const quarter = Math.round((Math.PI / 2 / 1.6) / DT);
    for (let i = 0; i < quarter; i++) {
      e = stepEnemy(e, 800, 460, DT, true).enemy; // player directly below: out of horizontal range
    }
    expect(e.y).toBe(300);
    expect(e.x).toBeGreaterThan(800 + 30);
  });
});

describe('Grenadier distance-keeping', () => {
  // These three asserted the OPPOSITE of their own names until TASK-041, with
  // comments that contradicted themselves ("player to the right ... moves the
  // enemy left, toward the player"). They matched the sign error in
  // `repositionDir` rather than the behaviour, which is why a Grenadier that
  // walked out of its own engage range and never attacked went unnoticed.
  it('backs away from a player who is too close', () => {
    const e = createEnemyState('g1', 'grenadier', 500, 450);
    // Player to the LEFT and too close: backing away grows the gap, so the
    // enemy moves RIGHT (x up). canFire=false so a pending attack does not take
    // precedence over repositioning.
    const r = stepEnemy(e, 400, 450, DT, false); // distance 100 < preferred-24
    expect(r.enemy.x).toBeGreaterThan(500);
  });

  it('backs away from a right player who is too close', () => {
    const e = createEnemyState('g1', 'grenadier', 500, 450);
    // Player to the RIGHT and too close: backing away moves the enemy LEFT.
    const r = stepEnemy(e, 600, 450, DT, false); // distance 100 < preferred-24
    expect(r.enemy.x).toBeLessThan(500);
  });

  it('closes in on a player who is too far', () => {
    const e = createEnemyState('g1', 'grenadier', 500, 450);
    // Player to the RIGHT and too far: closing in shrinks the gap, so the enemy
    // moves RIGHT (x up).
    const r = stepEnemy(e, 900, 450, DT, true); // distance 400 > preferred+24
    expect(r.enemy.x).toBeGreaterThan(500);
  });
});
