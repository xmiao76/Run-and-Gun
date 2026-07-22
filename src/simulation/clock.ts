/**
 * Fixed-timestep accumulator.
 *
 * The simulation advances in discrete, fixed-size steps regardless of the
 * render frame rate. `tick` consumes a real-time delta and returns the number
 * of fixed steps to run this frame, clamping pathological deltas (tab switches)
 * so the loop cannot spiral.
 */

/** Logical update rate in hertz. */
export const SIM_HZ = 60;

/** Duration of one logical step in seconds. */
export const FIXED_DT = 1 / SIM_HZ;

/** Largest real-time delta (s) we will ever try to consume in one frame. */
export const MAX_FRAME_DELTA = 0.25;

export interface ClockState {
  accumulator: number;
}

export function createClock(): ClockState {
  return { accumulator: 0 };
}

export interface TickResult {
  steps: number;
  accumulator: number;
}

/** Returns how many fixed steps to run for a given real-time delta (seconds). */
export function tick(clock: ClockState, deltaSeconds: number): TickResult {
  const clamped = Math.min(Math.max(deltaSeconds, 0), MAX_FRAME_DELTA);
  const accumulator = clock.accumulator + clamped;
  const steps = Math.floor(accumulator / FIXED_DT);
  return { steps, accumulator: accumulator - steps * FIXED_DT };
}
