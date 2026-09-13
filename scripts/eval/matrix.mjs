/**
 * The run matrix: how a deterministic game gets varied runs.
 *
 * There is no RNG anywhere in the simulation, so a given policy on a given
 * start state produces a byte-identical trace every time. Variation therefore
 * has to be constructed, and the axes below are ordered by how many real game
 * bugs they turn up per run, not by how clever they look.
 */

import { SAMPLE_STEPS } from '../lib/policies.mjs';

/**
 * Playable level numbers.
 *
 * Declared here because the harness is plain Node and cannot import the game's
 * TypeScript level list. Everything downstream derives from this list rather
 * than hardcoding a count - `LEVELS.length`, never `% 2` - and
 * `tests/unit/evalMatrix.test.ts` fails if it ever falls out of step with the
 * game, so a new stage cannot be silently left untested.
 */
export const LEVELS = [1, 2, 3];
export const CHECKPOINTS = ['start', 'mid', 'preboss'];

/**
 * 3 lives reaches the game-over path; 30 (the shipped default) reaches the
 * later parts of a level. Running only the default would mean never testing
 * game over at all.
 */
export const LIVES = [3, 30];

export const WEAPONS = ['pulse', 'scatter', 'rapid', 'laser', 'flame'];

/** Chaos policies are not trying to finish, so they get a shorter budget. */
const CHAOS_BUDGET = 6_000;
const PILOT_BUDGET = 18_000;

/**
 * Axis 1 - start state. Deterministic, reproducible by id, and the axis that
 * answers the question the Level 2 door bug should have been caught by: is
 * every segment completable from its own checkpoint?
 */
function startStateRuns() {
  const runs = [];
  for (const level of LEVELS) {
    for (const checkpoint of CHECKPOINTS) {
      for (const lives of LIVES) {
        runs.push({ level, checkpoint, lives, policy: 'pilot', budget: PILOT_BUDGET });
      }
    }
  }
  // Starting weapon only varies at `preboss`: everywhere else the run walks
  // over pickups that overwrite it within seconds, so the axis would cost 24
  // runs to test nothing. At the boss it is the weapon you actually fight with.
  for (const level of LEVELS) {
    for (const weapon of WEAPONS) {
      runs.push({ level, checkpoint: 'preboss', lives: 30, policy: 'pilot', weapon, budget: PILOT_BUDGET });
    }
  }
  return runs;
}

/** Axis 2 - seeded hiccups on top of a pilot run. Best bugs per run. */
function hiccupRuns(seeds) {
  const runs = [];
  for (const seed of seeds) {
    const level = LEVELS[seed % LEVELS.length];
    runs.push({
      level,
      checkpoint: CHECKPOINTS[seed % CHECKPOINTS.length],
      lives: 30,
      policy: 'hiccup',
      seed,
      budget: PILOT_BUDGET
    });
  }
  return runs;
}

/** Axis 3 - scripted adversarial policies aimed at named mechanics. */
function scriptedRuns() {
  return [
    // The door and its trigger pad live in Level 2 past the mid checkpoint.
    { level: 2, checkpoint: 'mid', lives: 30, policy: 'doorCamper', budget: CHAOS_BUDGET },
    // Pit edges: Level 1 has two, both bridged by one-way platforms.
    { level: 1, checkpoint: 'start', lives: 30, policy: 'edgeNudger', budget: CHAOS_BUDGET },
    // Inside the boss body, which neither blocks nor damages on contact.
    { level: 1, checkpoint: 'preboss', lives: 30, policy: 'bossHugger', budget: CHAOS_BUDGET },
    { level: 2, checkpoint: 'preboss', lives: 30, policy: 'bossHugger', budget: CHAOS_BUDGET },
    // Blunt baselines.
    { level: 1, checkpoint: 'start', lives: 3, policy: 'rusher', budget: CHAOS_BUDGET },
    { level: 2, checkpoint: 'start', lives: 3, policy: 'rusher', budget: CHAOS_BUDGET },
    { level: 1, checkpoint: 'start', lives: 30, policy: 'jumper', budget: CHAOS_BUDGET },
    { level: 1, checkpoint: 'start', lives: 30, policy: 'crouchWalker', budget: CHAOS_BUDGET },
    // Idle safety: standing still must never wedge, leak, or throw.
    { level: 1, checkpoint: 'start', lives: 30, policy: 'idler', budget: CHAOS_BUDGET }
  ];
}

/** Axis 4 - pure input noise. Narrow reach, judged only on invariants. */
function fuzzRuns(seeds) {
  return seeds.map((seed) => ({
    level: LEVELS[seed % LEVELS.length],
    checkpoint: 'start',
    lives: 30,
    policy: 'fuzz',
    seed,
    budget: CHAOS_BUDGET
  }));
}

/**
 * Axis 5 - step batch size. A harness-correctness axis rather than a game one:
 * the same policy driven at different `advanceSteps` granularities must reach
 * the same place. This is exactly the axis that would have caught the TASK-020
 * defect, where a long batch kept simulating past a scene transition.
 */
function batchSizeRuns() {
  const budget = 1_800;
  return [1, SAMPLE_STEPS, 600].map((sampleSteps) => ({
    level: 1,
    checkpoint: 'start',
    lives: 30,
    policy: 'pilot',
    sampleSteps,
    budget
  }));
}

/**
 * Axis 6 - the full game as one session. The only configuration that exercises
 * the cross-level registry carry-over (the pilot staying engaged through the
 * results screen into Level 2).
 */
function chainRun() {
  return [{ level: 1, checkpoint: 'start', lives: 30, policy: 'pilot', chain: true, budget: PILOT_BUDGET }];
}

/**
 * `quick` is what a loop iteration runs; `full` is what a human runs before a
 * commit. Both reuse one browser, so the per-run cost is a context plus a page
 * load, not a Chromium launch.
 */
export function buildMatrix(options = {}) {
  const { quick = false, seeds = 4, filter = null } = options;

  const seedList = Array.from({ length: seeds }, (_, i) => i + 1);
  const runs = quick
    ? [
        ...LEVELS.flatMap((level) =>
          CHECKPOINTS.map((checkpoint) => ({
            level,
            checkpoint,
            lives: 30,
            policy: 'pilot',
            budget: PILOT_BUDGET
          }))
        ),
        ...scriptedRuns().slice(0, 3),
        ...fuzzRuns([1, 2, 3])
      ]
    : [
        ...startStateRuns(),
        ...hiccupRuns(seedList),
        ...scriptedRuns(),
        ...fuzzRuns(seedList.slice(0, 3)),
        ...batchSizeRuns(),
        ...chainRun()
      ];

  return filter ? runs.filter((r) => JSON.stringify(r).includes(filter)) : runs;
}
