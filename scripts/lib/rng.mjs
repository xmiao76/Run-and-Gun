/**
 * Seeded PRNG for the evaluation harness.
 *
 * The simulation itself has NO randomness anywhere - fixed 60 Hz timestep,
 * data-driven spawn triggers, fixed boss cycles, fixed particle tables - so
 * every run of a given policy is byte-identical. That determinism is
 * load-bearing for the test suite and is not worth giving up, so variation is
 * injected here, on the driver side, where a seed reproduces a run exactly
 * without touching the game.
 */

/** mulberry32: small, fast, and good enough to vary a run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const next = mulberry32(seed);
  return {
    seed,
    next,
    /** Integer in [min, max]. */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** Float in [min, max). */
    float(min, max) {
      return min + next() * (max - min);
    },
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    chance(p) {
      return next() < p;
    }
  };
}
