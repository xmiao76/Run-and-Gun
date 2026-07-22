/**
 * Deterministic player physics for the M1 sandbox.
 *
 * A pure step function over an immutable state: horizontal movement, variable
 * height jump, gravity, single-segment ground collision, and a lethal pit gap.
 * No DOM or Phaser dependency, so it is unit-testable with explicit time.
 */

import {
  ARENA_WIDTH,
  GRAVITY,
  GROUND_Y,
  JUMP_CUT_MULTIPLIER,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  PIT_X0,
  PIT_X1,
  PLAYER_HEIGHT,
  PLAYER_WIDTH
} from '../balance/player';
import type { InputState } from '../input/InputState';

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
}

export function createPlayerState(x: number, y: number): PlayerState {
  return { x, y, vx: 0, vy: 0, grounded: true };
}

/** True when the player's horizontal span overlaps the pit gap. */
export function isOverPit(x: number): boolean {
  return x + PLAYER_WIDTH > PIT_X0 && x < PIT_X1;
}

/** Ground top y at a given x, or null over the pit (no support). */
export function groundAt(x: number): number | null {
  return isOverPit(x) ? null : GROUND_Y;
}

export interface PlayerStepResult {
  player: PlayerState;
  /** Set when the player fell past the death threshold this step. */
  died: boolean;
}

/**
 * Advance the player by one fixed step. Edge-triggered `jumpPressed` only
 * initiates a jump while grounded; releasing `jumpHeld` mid-rise cuts the
 * upward velocity for variable jump height.
 */
export function stepPlayer(state: PlayerState, input: InputState, dt: number): PlayerStepResult {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const vx = dir * MOVE_SPEED;

  let { vy } = state;
  let { grounded } = state;

  if (grounded && input.jumpPressed) {
    vy = JUMP_VELOCITY;
    grounded = false;
  } else if (!input.jumpHeld && vy < 0) {
    vy *= JUMP_CUT_MULTIPLIER;
  }

  if (!grounded) {
    vy = Math.min(vy + GRAVITY * dt, MAX_FALL_SPEED);
  }

  let y = state.y + vy * dt;
  let x = state.x + vx * dt;
  if (x < 0) {
    x = 0;
  }
  if (x > ARENA_WIDTH - PLAYER_WIDTH) {
    x = ARENA_WIDTH - PLAYER_WIDTH;
  }

  const support = groundAt(x);
  const feet = y + PLAYER_HEIGHT;
  const prevFeet = state.y + PLAYER_HEIGHT;
  if (support === null) {
    // No ground under the new position (the pit): unsupported, so fall.
    grounded = false;
  } else if (feet >= support && prevFeet <= support + 0.001) {
    // Feet crossing or resting on the ground plane from above: land. The tiny
    // epsilon on prevFeet keeps a resting player (feet == support) grounded.
    y = support - PLAYER_HEIGHT;
    vy = 0;
    grounded = true;
  } else {
    grounded = false;
  }

  return { player: { x, y, vx, vy, grounded }, died: false };
}
