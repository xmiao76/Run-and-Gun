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
}

export function createNeutralInput(): InputState {
  return {
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressed: false,
    fireHeld: false,
    firePressed: false
  };
}

/** Logical OR merge so multiple input sources (e.g. keyboard + debug) combine. */
export function mergeInput(a: InputState, b: InputState): InputState {
  return {
    left: a.left || b.left,
    right: a.right || b.right,
    jumpHeld: a.jumpHeld || b.jumpHeld,
    jumpPressed: a.jumpPressed || b.jumpPressed,
    fireHeld: a.fireHeld || b.fireHeld,
    firePressed: a.firePressed || b.firePressed
  };
}
