import { describe, expect, it } from 'vitest';

import { getEnemyDef } from '../../src/balance/enemies';
import { createEnemyState, stepEnemy } from '../../src/simulation/enemies';

/**
 * TASK-041: the Grenadier must actually attack.
 *
 * The eval matrix's coverage invariant reported that the Grenadier appeared
 * throughout the game but never damaged the player anywhere in the matrix. The
 * cause was `repositionDir` returning the opposite of what its own doc comment
 * promised: a Grenadier that was too FAR from the player walked further away
 * instead of closing in, retreated out of its own 340 px engage range within a
 * couple of seconds, and could never fire again.
 *
 * `enemyReposition.test.ts` pins the direction rule itself. These tests pin the
 * behaviour it exists to produce, so a future sign flip is caught by what the
 * player would actually notice rather than only by an abstract -1/+1.
 */

const DT = 1 / 60;

/** Run a lone grenadier against a stationary player and report what happened. */
function engage(enemyX: number, playerX: number, seconds = 20): { shots: number; finalX: number; minDistance: number } {
  let enemy = createEnemyState('g1', 'grenadier', enemyX, 450);
  let shots = 0;
  let minDistance = Math.abs(enemyX - playerX);
  for (let i = 0; i < 60 * seconds; i++) {
    const result = stepEnemy(enemy, playerX, 450, DT, true);
    enemy = result.enemy;
    if (result.fireIntent) {
      shots += 1;
    }
    minDistance = Math.min(minDistance, Math.abs(enemy.x - playerX));
  }
  return { shots, finalX: enemy.x, minDistance };
}

describe('grenadier engagement', () => {
  it('closes in on a player that is too far away instead of retreating', () => {
    // Player to the LEFT. The grenadier starts beyond its preferred range, so
    // it must move left, toward them.
    const { finalX } = engage(1500, 1205, 3);
    expect(finalX).toBeLessThan(1500);
  });

  it('closes in when the player is on the other side too', () => {
    // Mirror image: player to the RIGHT, so the grenadier must move right.
    const { finalX } = engage(1205, 1500, 3);
    expect(finalX).toBeGreaterThan(1205);
  });

  it('stays inside its own engage range rather than walking out of the fight', () => {
    // The failure mode in one assertion: the old sign error let the grenadier
    // drift past engageRange and go permanently quiet.
    const def = getEnemyDef('grenadier');
    const { finalX } = engage(1500, 1205);
    expect(Math.abs(finalX - 1205)).toBeLessThanOrEqual(def.engageRange);
  });

  it('settles near its preferred range rather than closing to point blank', () => {
    const def = getEnemyDef('grenadier');
    const { finalX } = engage(1500, 1205);
    const distance = Math.abs(finalX - 1205);
    // The distance-keeping band, with a step of slack either side.
    expect(distance).toBeGreaterThan(def.preferredRange - 60);
    expect(distance).toBeLessThan(def.preferredRange + 60);
  });

  it('backs off when the player crowds it', () => {
    // Too close: it must grow the gap, not shrink it further. Asserted as the
    // change in distance rather than a precise landing spot, because the
    // grenadier stops repositioning while it winds up a shot and so approaches
    // the band at less than its full move speed.
    const startGap = 1250 - 1205;
    const { finalX } = engage(1250, 1205, 3);
    const endGap = Math.abs(finalX - 1205);
    expect(endGap).toBeGreaterThan(startGap * 2);
  });

  it('lands a steady stream of grenades over a sustained engagement', () => {
    // The real regression guard. Under the old sign error this was 0; a bare
    // "> 0" would not have caught the bug in the shipped encounter, where the
    // grenadier still managed a single lucky shot before drifting away, so
    // this asserts something close to its actual fire rate.
    const def = getEnemyDef('grenadier');
    const seconds = 20;
    const { shots } = engage(1500, 1205, seconds);
    // Allowing for the telegraph wind-up on every cycle.
    const ceiling = seconds / def.fireInterval;
    expect(shots).toBeGreaterThan(ceiling * 0.5);
  });
});
