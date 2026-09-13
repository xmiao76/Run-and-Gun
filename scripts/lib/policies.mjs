/**
 * Policies: what drives the player during an evaluation run.
 *
 * A policy is `{ name, autopilot, next(runtime, ctx) -> ActSpec }`. It is asked
 * for one act spec per sample window, and the spec is merged into the game the
 * same way a device is (the bridge ORs with keyboard/gamepad/pilot input), so
 * nothing here is a cheat.
 *
 * Two families, and they find different bugs:
 *  - `pilot` reaches deep, legitimate game states (bosses, late geometry) but
 *    only ever visits states a competent player visits.
 *  - the scripted policies are deliberately incompetent or adversarial. They
 *    stay near the start of a level, which is exactly where "stand in the
 *    doorway", "nudge the pit edge" and "ride the platform" bugs live.
 *
 * Note the OR-merge cuts one way: a policy can ADD inputs to the built-in
 * pilot but can never suppress what the pilot asks for. Hiccup injection on top
 * of `pilot` is therefore additive only - an honest model of "a human bumps a
 * key", not a true override. A real override needs `?autopilot=remote`.
 */

import { createRng } from './rng.mjs';

/** Every policy asked for a spec this often (steps); 0.5 s of simulation. */
export const SAMPLE_STEPS = 30;

const NOTHING = {};

/**
 * `expectsProgress: false` means the policy is not trying to get anywhere, so
 * the stall detector must not run against it. Without that gate the idler
 * reports a stall every ten simulated seconds forever - technically true, and
 * exactly the kind of noise that gets a detector muted and then ignored.
 */

/** The built-in heuristic pilot plays; the driver adds no input of its own. */
function pilotPolicy() {
  return {
    name: 'pilot',
    autopilot: true,
    expectsProgress: true,
    next: () => NOTHING
  };
}

/** Hold right and fire forever. Finds "what if the player never stops". */
function rusherPolicy() {
  return {
    name: 'rusher',
    autopilot: false,
    expectsProgress: true,
    next: (runtime, ctx) => (ctx.sample === 0 ? { hold: ['right'], tap: ['fire'] } : { tap: ['fire'] })
  };
}

/** No input at all. The player should die or idle safely, never wedge. */
function idlerPolicy() {
  return {
    name: 'idler',
    autopilot: false,
    expectsProgress: false,
    next: () => NOTHING
  };
}

/** Advance while mashing jump: stresses airborne collision and one-ways. */
function jumperPolicy() {
  return {
    name: 'jumper',
    autopilot: false,
    expectsProgress: true,
    next: (runtime, ctx) => (ctx.sample === 0 ? { hold: ['right'], tap: ['jump'] } : { tap: ['jump'] })
  };
}

/**
 * Oscillate on and around a trigger pad / doorway.
 *
 * The Level 2 door bug was exactly this shape: the pad held the door open only
 * while the player stood on it, and the pad ended before the doorway, so the
 * door shut on anyone walking through. Stepping on and off a pad repeatedly is
 * the motion that exposes that class.
 */
function doorCamperPolicy() {
  return {
    name: 'doorCamper',
    autopilot: false,
    expectsProgress: true,
    next: (runtime, ctx) => {
      const phase = ctx.sample % 6;
      if (phase < 3) {
        return ctx.sample === 0 ? { hold: ['right'] } : NOTHING;
      }
      if (phase === 3) {
        return { release: ['right'], hold: ['left'] };
      }
      if (phase === 5) {
        return { release: ['left'], hold: ['right'] };
      }
      return NOTHING;
    }
  };
}

/**
 * Tap-advance in short bursts so the player keeps stopping at ledge edges,
 * instead of running cleanly past them the way the pilot does.
 */
function edgeNudgerPolicy() {
  return {
    name: 'edgeNudger',
    autopilot: false,
    expectsProgress: true,
    next: (runtime, ctx) => (ctx.sample % 2 === 0 ? { hold: ['right'] } : { release: ['right'] })
  };
}

/**
 * Walk into the boss and hold fire from inside it. The boss body neither blocks
 * movement nor damages on contact, so this is a reachable state that normal
 * play rarely produces.
 */
function bossHuggerPolicy() {
  return {
    name: 'bossHugger',
    autopilot: false,
    expectsProgress: true,
    next: (runtime, ctx) => {
      const bossX = runtime?.bossX;
      if (typeof bossX !== 'number') {
        return ctx.sample === 0 ? { hold: ['right'], tap: ['fire'] } : { tap: ['fire'] };
      }
      const playerX = runtime.playerX ?? 0;
      if (playerX < bossX - 8) {
        return { release: ['left'], hold: ['right'], tap: ['fire'] };
      }
      if (playerX > bossX + 8) {
        return { release: ['right'], hold: ['left'], tap: ['fire'] };
      }
      return { release: ['left', 'right'], tap: ['fire'] };
    }
  };
}

/**
 * Advance in bursts, crouching between them, so the crouch hitbox meets real
 * geometry. Crouch must be intermittent: holding it pins the player in place,
 * so a permanent crouch-walk never leaves the spawn point and tests nothing.
 */
function crouchWalkerPolicy() {
  return {
    name: 'crouchWalker',
    autopilot: false,
    expectsProgress: true,
    next: (runtime, ctx) =>
      ctx.sample % 4 === 0
        ? { release: ['crouch'], hold: ['right'], tap: ['fire'] }
        : ctx.sample % 4 === 2
          ? { hold: ['crouch'], tap: ['fire'] }
          : { tap: ['fire'] }
  };
}

const HOLDABLE = ['left', 'right', 'aimUp', 'aimDown', 'crouch', 'drop'];
const TAPPABLE = ['jump', 'fire'];

/**
 * The pilot plays, but every so often a burst of stray input lands on top.
 *
 * This is the best bug-per-token axis available. The pilot carries the run into
 * deep, legitimate states (late geometry, boss phases) that no random policy
 * will ever reach; the hiccups then perturb *around* those states, and the
 * pilot recovers and carries on. That combination is what reaches "the player
 * did something dumb in a specific place", which is where door, platform and
 * trigger bugs actually live.
 *
 * Additive only: bridge input is OR-merged with the pilot's, so a hiccup can
 * add a keypress but never suppress one. That is an honest model of a human
 * bumping a key, not a true override - overriding needs `?autopilot=remote`.
 */
function hiccupPolicy(seed) {
  const rng = createRng(seed);
  let remaining = 0;
  let held = [];
  return {
    name: 'hiccup',
    autopilot: true,
    expectsProgress: true,
    seed,
    next: () => {
      if (remaining > 0) {
        remaining -= 1;
        if (remaining === 0 && held.length > 0) {
          const release = held;
          held = [];
          return { release };
        }
        return rng.chance(0.5) ? { tap: [rng.pick(TAPPABLE)] } : {};
      }
      if (!rng.chance(0.12)) {
        return {};
      }
      remaining = rng.int(1, 4); // 0.5-2 s of simulation
      held = [rng.pick(HOLDABLE)];
      return { hold: held, tap: rng.chance(0.5) ? [rng.pick(TAPPABLE)] : [] };
    }
  };
}

/**
 * Pure seeded input noise, with no pilot underneath.
 *
 * It will never clear a level - it barely leaves the first screen - so it is
 * marked `expectsProgress: false` and judged only on invariants: page errors,
 * non-finite values, out-of-bounds positions, resource growth. Real fuzzer
 * value, narrow reach.
 */
function fuzzPolicy(seed) {
  const rng = createRng(seed);
  let held = [];
  return {
    name: 'fuzz',
    autopilot: false,
    expectsProgress: false,
    seed,
    next: () => {
      const release = held;
      held = [];
      const spec = { release, hold: [], tap: [] };
      for (const action of HOLDABLE) {
        if (rng.chance(0.25)) {
          held.push(action);
        }
      }
      spec.hold = held;
      for (const action of TAPPABLE) {
        if (rng.chance(0.4)) {
          spec.tap.push(action);
        }
      }
      return spec;
    }
  };
}

const SEEDED_FACTORIES = {
  hiccup: hiccupPolicy,
  fuzz: fuzzPolicy
};

const FACTORIES = {
  pilot: pilotPolicy,
  rusher: rusherPolicy,
  idler: idlerPolicy,
  jumper: jumperPolicy,
  doorCamper: doorCamperPolicy,
  edgeNudger: edgeNudgerPolicy,
  bossHugger: bossHuggerPolicy,
  crouchWalker: crouchWalkerPolicy
};

export const POLICY_NAMES = [...Object.keys(FACTORIES), ...Object.keys(SEEDED_FACTORIES)];

export function createPolicy(name, options = {}) {
  const seeded = SEEDED_FACTORIES[name];
  if (seeded) {
    return seeded(options.seed ?? 1);
  }
  const factory = FACTORIES[name];
  if (!factory) {
    throw new Error(`unknown policy: ${name} (known: ${POLICY_NAMES.join(', ')})`);
  }
  return factory();
}
