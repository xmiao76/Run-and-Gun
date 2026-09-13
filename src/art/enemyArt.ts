/**
 * Enemy presentation helpers: pure mappings from enemy state to sprite frame.
 *
 * Every archetype has three frames: two for its idle/walk cycle and one for
 * its attack. Frame choice is a function of the enemy's simulation state and
 * the scene's simulation step only - never wall time - so the animation is
 * deterministic under the manual clock and the eval harness, and freezes
 * correctly while the game is paused.
 */

import type { EnemyKind } from '../balance/enemies';
import type { EnemyStateName } from '../simulation/enemies';

/** Simulation steps per idle-cycle frame (10 steps ≈ 167 ms at 60 Hz). */
export const ENEMY_FRAME_STEPS = 10;

export interface EnemyFrameState {
  kind: EnemyKind;
  state: EnemyStateName;
  telegraphing: boolean;
}

/** Body sprite for an enemy kind's A (rest) frame; kept for compatibility. */
export function enemyTexture(kind: EnemyKind): string {
  return 'art/enemy-' + kind;
}

/**
 * The frame an enemy shows this step.
 *
 * The attack frame covers the whole wind-up as well as the shot itself, which
 * is exactly the moment the player needs the enemy to read as dangerous.
 */
export function enemyFrame(enemy: EnemyFrameState, stepIndex: number): string {
  if (enemy.telegraphing || enemy.state === 'telegraph' || enemy.state === 'fire') {
    return `art/enemy-${enemy.kind}-fire`;
  }
  return `art/enemy-${enemy.kind}${Math.floor(stepIndex / ENEMY_FRAME_STEPS) % 2 === 0 ? '' : '-b'}`;
}
