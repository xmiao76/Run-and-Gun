/**
 * Hit-stop: the brief world freeze on a heavy impact that makes a hit land.
 *
 * Measured in SIMULATION STEPS, never milliseconds, for the same reason
 * everything else in this game is: the manual clock and the eval harness drive
 * the game one step at a time, and a wall-clock freeze would be invisible to
 * them and non-reproducible.
 *
 * The freeze holds the world, not the clock. A frozen step is still a step -
 * it reads input, counts toward `stepIndex`, and is counted by `advanceSteps`,
 * exactly like the existing death pause and completion timer. That is what
 * keeps the fixed-step contract intact: `advanceSteps(n)` always advances n.
 *
 * Pure, like `screenShake`, so the policy can be tuned and tested in one place.
 */

export type HitStopEvent = 'bossHit' | 'playerDeath' | 'bossDefeat';

export interface HitStopState {
  /** Steps the world stays frozen; 0 means running. */
  stepsRemaining: number;
  /**
   * Steps until a REPEATABLE event may freeze the world again.
   *
   * Without this, hit-stop defeats itself. A boss hit is a heavy impact when
   * it punctuates the fight, but the Rapid Carbine lands one every six steps,
   * and freezing two steps out of every six turns a boss fight into a slideshow
   * - the eval matrix caught exactly that, with a point-blank policy blowing
   * its entire step budget on a fight it used to win comfortably.
   */
  refractoryRemaining: number;
}

/**
 * Freeze lengths, weakest to strongest, at 60 Hz.
 *
 * These are deliberately short. Hit-stop works by being felt rather than seen:
 * past about a sixth of a second it stops reading as impact and starts reading
 * as a dropped frame.
 */
const HIT_STOP_STEPS: Readonly<Record<HitStopEvent, number>> = {
  // A boss hit is the one event that repeats throughout a fight, so it is the
  // lightest freeze AND the only rate-limited one (see REFRACTORY_STEPS).
  // Two steps is the shortest pause that reads as impact rather than as
  // nothing at all; measured against the eval matrix it costs a competent
  // run about 1-2% of its steps.
  bossHit: 2,
  playerDeath: 6,
  bossDefeat: 10
};

/**
 * Events that can fire over and over in normal play, and so must be rate
 * limited. One-shot events (a death, a boss defeat) are never blocked.
 */
const REPEATABLE: Readonly<Record<HitStopEvent, boolean>> = {
  bossHit: true,
  playerDeath: false,
  bossDefeat: false
};

/**
 * Minimum gap between two repeatable freezes (~0.37 s at 60 Hz).
 *
 * Long enough that sustained fire spends under a tenth of its steps frozen,
 * short enough that individual hits in a fight still land with a jolt.
 */
const REFRACTORY_STEPS = 22;

export function createHitStop(): HitStopState {
  return { stepsRemaining: 0, refractoryRemaining: 0 };
}

/** The freeze an event asks for, or 0 when it must not freeze. */
export function hitStopFor(event: HitStopEvent, reducedFlash: boolean): number {
  if (reducedFlash) {
    // Reduced flash means a calmer game, and a freeze is a jolt even though it
    // is not a flash. Suppressed entirely rather than shortened, matching how
    // `shakeFor` treats screen shake.
    return 0;
  }
  return HIT_STOP_STEPS[event] ?? 0;
}

/**
 * Apply an event to the freeze state.
 *
 * Freezes take the LONGER of the two rather than adding: rapid fire into a
 * boss lands a `bossHit` every few steps, and stacking those would grind the
 * game to a halt exactly when the player is doing well. Taking the max still
 * lets a stronger event (a defeat) upgrade a weaker one already running.
 */
export function triggerHitStop(state: HitStopState, event: HitStopEvent, reducedFlash: boolean): HitStopState {
  const steps = hitStopFor(event, reducedFlash);
  if (steps <= 0) {
    return state;
  }
  const repeatable = REPEATABLE[event] === true;
  if (repeatable && state.refractoryRemaining > 0) {
    return state;
  }
  const refractoryRemaining = repeatable ? REFRACTORY_STEPS : state.refractoryRemaining;
  if (steps <= state.stepsRemaining) {
    return { ...state, refractoryRemaining };
  }
  return { stepsRemaining: steps, refractoryRemaining };
}

/** True while the world should hold still. */
export function isFrozen(state: HitStopState): boolean {
  return state.stepsRemaining > 0;
}

/**
 * Consume one step of freeze.
 *
 * Returns the next state and whether THIS step was frozen, so the caller can
 * hold the world on the step that consumed the freeze rather than one late.
 */
export function tickHitStop(state: HitStopState): { state: HitStopState; frozen: boolean } {
  const refractoryRemaining = Math.max(0, state.refractoryRemaining - 1);
  if (state.stepsRemaining <= 0) {
    return { state: { stepsRemaining: 0, refractoryRemaining }, frozen: false };
  }
  return { state: { stepsRemaining: state.stepsRemaining - 1, refractoryRemaining }, frozen: true };
}
