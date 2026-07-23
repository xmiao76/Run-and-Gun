import { type InputState } from '../input/InputState';

/**
 * Pure aim-direction math for eight-direction firing (GAME_REQUIREMENTS.md
 * section 4, ACCEPTANCE_CRITERIA C4).
 *
 * The aim angle is derived from the held direction modifiers and the player's
 * facing, in degrees with 0 = right, -90 = up, 90 = down, 180/-180 = left.
 * Up/down take priority (eight-way diagonals); a grounded down modifier means
 * crouch-fire forward, while an airborne down modifier fires downward.
 */

export function aimAngle(input: InputState, facing: number, grounded: boolean): number {
  const up = input.aimUp ?? false;
  const down = input.aimDown ?? false;
  if (up) {
    if (input.left) {
      return -135;
    }
    if (input.right) {
      return -45;
    }
    return -90;
  }
  if (down && !grounded) {
    if (input.left) {
      return 135;
    }
    if (input.right) {
      return 45;
    }
    return 90;
  }
  return facing < 0 ? 180 : 0;
}

/** Rotate a velocity vector by an aim angle, preserving its magnitude. */
export function rotateVelocity(vx: number, vy: number, angleDeg: number): { vx: number; vy: number } {
  const radians = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { vx: vx * cos - vy * sin, vy: vx * sin + vy * cos };
}
