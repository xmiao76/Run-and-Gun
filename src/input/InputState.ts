/**
 * Normalized, per-step input state.
 *
 * Gameplay logic reads this only - never raw browser events. Keyboard, gamepad,
 * touch, and the debug test bridge all produce the same shape.
 *
 * `*Held` flags are level-triggered (true while the action is down).
 * `*Pressed` flags are edge-triggered (true for the single step the action
 * transitions from up to down) and are consumed by the system that reads them.
 */

export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  fireHeld: boolean;
  firePressed: boolean;
  /** Hold to crouch while grounded (optional; defaults to false). */
  crouch?: boolean;
  /** Edge/hold to drop through a one-way platform (optional; defaults to false). */
  drop?: boolean;
  /** Aim modifier: fire upward / diagonal-up (optional; defaults to false). */
  aimUp?: boolean;
  /** Aim modifier: fire downward while airborne (optional; defaults to false). */
  aimDown?: boolean;
}

export function createNeutralInput(): InputState {
  return {
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressed: false,
    fireHeld: false,
    firePressed: false,
    crouch: false,
    drop: false,
    aimUp: false,
    aimDown: false
  };
}

/** True when no action is active - used to detect "the human is idle". */
export function isNeutralInput(s: InputState): boolean {
  return (
    !s.left &&
    !s.right &&
    !s.jumpHeld &&
    !s.jumpPressed &&
    !s.fireHeld &&
    !s.firePressed &&
    !(s.crouch ?? false) &&
    !(s.drop ?? false) &&
    !(s.aimUp ?? false) &&
    !(s.aimDown ?? false)
  );
}

/** Logical OR merge so multiple input sources (e.g. keyboard + debug) combine. */
export function mergeInput(a: InputState, b: InputState): InputState {
  return {
    left: a.left || b.left,
    right: a.right || b.right,
    jumpHeld: a.jumpHeld || b.jumpHeld,
    jumpPressed: a.jumpPressed || b.jumpPressed,
    fireHeld: a.fireHeld || b.fireHeld,
    firePressed: a.firePressed || b.firePressed,
    crouch: (a.crouch ?? false) || (b.crouch ?? false),
    drop: (a.drop ?? false) || (b.drop ?? false),
    aimUp: (a.aimUp ?? false) || (b.aimUp ?? false),
    aimDown: (a.aimDown ?? false) || (b.aimDown ?? false)
  };
}
