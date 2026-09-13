/**
 * Gameplay invariants, as pure functions over a run trace.
 *
 * Nothing here touches Playwright or the browser: a trace is a plain array of
 * snapshot projections, so every detector is unit-testable against synthetic
 * traces. That matters more than it sounds - a stall detector that cries wolf
 * on the boss standoff gets muted after the third false alarm and then finds
 * nothing. The false-positive cases are pinned in tests/unit/evalChecks.test.ts
 * before this is ever pointed at the game.
 */

export const CRITICAL = 'CRITICAL';
export const HIGH = 'HIGH';

/**
 * Stall windows, in simulation steps (60 = 1 second).
 *
 * 600 (10 s) is chosen against the slowest legitimately stationary state in the
 * game: the Level 2 vertical platform runs 320..420 at 50 px/s, a 4 s round
 * trip. Ten seconds is 2.5 cycles - clear of the wait, still tight enough that
 * a wedged run is caught in ten simulated seconds (a fraction of a wall second).
 * The completion delay (1.2 s), death pause (0.9 s) and invuln window are all
 * far below it.
 */
export const TRAVERSAL_STALL_STEPS = 600;

/**
 * In the boss arena the player is SUPPOSED to hold position between attack
 * cycles, and `maxPlayerX` cannot grow at all, so the traversal window would
 * fire constantly. A boss stall is judged only on fight progress and gets a
 * full simulated minute; if it trips, the boss is genuinely unkillable.
 */
export const BOSS_STALL_STEPS = 3600;

/**
 * A respawn loop is CONSECUTIVE deaths in one place: die, respawn, walk back,
 * die again, with nothing in between.
 *
 * Counting total deaths per bucket across a whole run was far too loose. A
 * policy that stutters into enemy fire racked up 8 deaths in one bucket while
 * never dying there twice in a row (they ping-ponged across seven buckets), and
 * a perturbed pilot that COMPLETED the level still tripped it with 3 deaths
 * spread over a boss fight. Neither is a loop; both drowned the real ones.
 * Four in a row is a cycle nobody is escaping on their own.
 */
export const DEATH_TRAP_WINDOW_X = 96;
export const DEATH_TRAP_COUNT = 4;

/** Matches the caps the soak test asserts. */
export const RESOURCE_CAPS = {
  maxEnemiesSeen: 12,
  maxPlayerBulletsSeen: 96,
  maxEnemyBulletsSeen: 96,
  particleCount: 400
};

const NUMERIC_FIELDS = [
  'playerX',
  'playerY',
  'maxPlayerX',
  'lives',
  'score',
  'stepIndex',
  'bossHealth',
  'enemyCount',
  'projectileCount',
  'enemyProjectileCount'
];

function finding(kind, severity, sample, evidence, extra = {}) {
  return {
    kind,
    severity,
    stepIndex: sample?.stepIndex ?? 0,
    x: typeof sample?.playerX === 'number' ? Math.round(sample.playerX) : null,
    evidence,
    ...extra
  };
}

/** Bucket an x so the same wedge from different runs aggregates into one finding. */
export function bucketX(x, size = 64) {
  return Math.floor(x / size) * size;
}

/**
 * Did the run move forward between two samples?
 *
 * Deliberately monotone. A raw `playerX > lastX` delta is wrong in both
 * directions: the boss standoff oscillates left and right forever (false
 * progress), and a player wedged against a closed door jitters a pixel or two
 * (also false progress). Every signal below only ever moves one way.
 */
export function progressed(prev, cur) {
  return (
    Math.floor(cur.maxPlayerX ?? 0) > Math.floor(prev.maxPlayerX ?? 0) ||
    cur.checkpoint !== prev.checkpoint ||
    cur.lives !== prev.lives ||
    (cur.score ?? 0) > (prev.score ?? 0) ||
    (cur.deaths ?? 0) > (prev.deaths ?? 0) ||
    (cur.bossHealth ?? 0) < (prev.bossHealth ?? 0) ||
    (cur.subcomponentsAlive ?? 0) < (prev.subcomponentsAlive ?? 0) ||
    (cur.bossPhase ?? 0) > (prev.bossPhase ?? 0) ||
    (cur.containersAlive ?? 0) < (prev.containersAlive ?? 0) ||
    Boolean(cur.completing) ||
    cur.ending !== null
  );
}

/** Boss-arena progress: max-x cannot grow there, so judge the fight itself. */
export function bossProgressed(prev, cur) {
  return (
    cur.lives !== prev.lives ||
    (cur.deaths ?? 0) > (prev.deaths ?? 0) ||
    (cur.bossHealth ?? 0) < (prev.bossHealth ?? 0) ||
    (cur.subcomponentsAlive ?? 0) < (prev.subcomponentsAlive ?? 0) ||
    (cur.bossPhase ?? 0) > (prev.bossPhase ?? 0) ||
    Boolean(cur.completing) ||
    cur.ending !== null
  );
}

/**
 * States where standing still is correct, so the stall clock should not run.
 *
 * `invuln` is deliberately NOT here: it lasts a long time and the player can
 * still move throughout it, so suppressing on it would blind the detector.
 * Waiting on a moving platform is handled by the window size instead of a
 * suppression rule, which keeps the rule set small enough to reason about.
 */
export function stallSuppressed(s) {
  return Boolean(s.dying || s.completing || s.paused || s.autoPaused || s.ending !== null);
}

function inBossRegime(s) {
  return Boolean(s.bossActive) && (s.bossHealth ?? 0) > 0;
}

/**
 * Find windows where the run made no progress at all.
 *
 * This is the door-bug detector: "held right for ten simulated seconds at
 * x=1778 and never moved" is precisely the signature of geometry nobody can
 * pass. Suppressed samples freeze the clock rather than resetting it, so a run
 * cannot dodge detection by dying on a timer.
 */
export function detectStall(samples, options = {}) {
  const traversalWindow = options.traversalWindow ?? TRAVERSAL_STALL_STEPS;
  const bossWindow = options.bossWindow ?? BOSS_STALL_STEPS;
  const findings = [];
  if (samples.length < 2) {
    return findings;
  }

  let stalled = 0;
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const cur = samples[i];
    if (stallSuppressed(cur)) {
      continue; // frozen, not reset
    }
    const boss = inBossRegime(cur);
    const moved = boss ? bossProgressed(prev, cur) : progressed(prev, cur);
    if (moved) {
      stalled = 0;
      continue;
    }
    stalled += Math.max(0, (cur.stepIndex ?? 0) - (prev.stepIndex ?? 0));
    const window = boss ? bossWindow : traversalWindow;
    if (stalled > window) {
      findings.push(
        finding(
          boss ? 'bossStall' : 'stall',
          CRITICAL,
          cur,
          boss
            ? `no fight progress for ${stalled} steps with the boss active`
            : `no progress for ${stalled} steps at x=${Math.round(cur.playerX ?? 0)}`,
          { bucket: bucketX(cur.playerX ?? 0), stalledSteps: stalled }
        )
      );
      stalled = 0; // report once per window, not once per sample
    }
  }
  return findings;
}

/**
 * Respawn loops: the player dies repeatedly in one small stretch of level.
 *
 * The stall detector cannot see this - every cycle changes `lives`, which reads
 * as progress - so it needs its own pass over the death log.
 */
export function detectDeathTrap(deaths = [], options = {}) {
  const windowX = options.windowX ?? DEATH_TRAP_WINDOW_X;
  const threshold = options.count ?? DEATH_TRAP_COUNT;
  const findings = [];

  // Deaths arrive in order, so consecutive entries are consecutive in time.
  let runStart = 0;
  const bucketOf = (d) => Math.floor((d.x ?? 0) / windowX);
  for (let i = 1; i <= deaths.length; i++) {
    const sameAsPrevious = i < deaths.length && bucketOf(deaths[i]) === bucketOf(deaths[i - 1]);
    if (sameAsPrevious) {
      continue;
    }
    const streak = deaths.slice(runStart, i);
    if (streak.length >= threshold) {
      const causes = [...new Set(streak.map((d) => d.cause))].join(',');
      findings.push({
        kind: 'deathTrap',
        severity: CRITICAL,
        stepIndex: streak[0].stepIndex ?? 0,
        x: Math.round(streak[0].x ?? 0),
        bucket: bucketOf(streak[0]) * windowX,
        evidence:
          `${streak.length} deaths in a row within ${windowX}px of x=${Math.round(streak[0].x ?? 0)}` +
          ` (causes: ${causes}) - respawning straight back into it`
      });
    }
    runStart = i;
  }

  // A death that cost no life is the invulnerable-pit-death case: the player
  // gets a free ride back to the checkpoint (TASK-026).
  const free = deaths.filter((d) => d.costLife === false);
  if (free.length > 0) {
    findings.push({
      kind: 'freeDeath',
      severity: HIGH,
      stepIndex: free[0].stepIndex ?? 0,
      x: Math.round(free[0].x ?? 0),
      evidence: `${free.length} death(s) cost no life (invulnerability swallowed the loss but the respawn still ran)`
    });
  }
  return findings;
}

/** Position sanity and non-finite numbers. */
export function checkBounds(samples, levelWidth) {
  const findings = [];
  for (const s of samples) {
    for (const field of NUMERIC_FIELDS) {
      const v = s[field];
      if (v !== undefined && v !== null && !Number.isFinite(v)) {
        findings.push(finding('nanField', CRITICAL, s, `${field} is not finite: ${v}`));
      }
    }
    const x = s.playerX;
    if (typeof x === 'number' && Number.isFinite(x) && (x < -32 || x > levelWidth + 32)) {
      findings.push(finding('outOfBounds', CRITICAL, s, `playerX ${Math.round(x)} outside 0..${levelWidth}`));
    }
  }
  return findings;
}

/** Counters that may only ever move one way. */
export function checkMonotonic(samples) {
  const findings = [];
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const cur = samples[i];
    if ((cur.lives ?? 0) > (prev.lives ?? 0)) {
      findings.push(finding('monotonic', HIGH, cur, `lives rose from ${prev.lives} to ${cur.lives}`));
    }
    if ((cur.score ?? 0) < (prev.score ?? 0)) {
      findings.push(finding('monotonic', HIGH, cur, `score fell from ${prev.score} to ${cur.score}`));
    }
    if (prev.bossActive && cur.bossActive && (cur.bossHealth ?? 0) > (prev.bossHealth ?? 0)) {
      findings.push(
        finding('monotonic', HIGH, cur, `boss health rose from ${prev.bossHealth} to ${cur.bossHealth} while active`)
      );
    }
  }
  return findings;
}

/** Entity and particle high-water marks, matching the soak caps. */
export function checkResources(samples, caps = RESOURCE_CAPS) {
  const findings = [];
  let worst = null;
  for (const s of samples) {
    for (const [field, cap] of Object.entries(caps)) {
      const v = s[field];
      if (typeof v === 'number' && v > cap) {
        if (!worst || v > worst.value) {
          worst = { field, value: v, sample: s, cap };
        }
      }
    }
  }
  if (worst) {
    findings.push(
      finding('resourceBounds', HIGH, worst.sample, `${worst.field} reached ${worst.value}, cap is ${worst.cap}`)
    );
  }
  return findings;
}

/** Relationships between fields that must always hold together. */
export function checkStructural(samples) {
  const findings = [];
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    if (s.bossX !== null && s.bossX !== undefined && !s.bossActive) {
      findings.push(finding('structural', HIGH, s, 'bossX published while the boss is inactive'));
    }
    if (s.bossVulnerable && !s.bossActive) {
      findings.push(finding('structural', HIGH, s, 'boss reported vulnerable while inactive'));
    }
    // "Out of lives but the run never ended" has to persist to count. Losing the
    // last life sets the flag, and the scene queues the game-over transition at
    // the top of the NEXT step, so exactly one sample can legitimately land in
    // that window - and one did, the first time a run burned all 30 lives.
    const stranded = (x) => x !== undefined && (x.lives ?? 1) <= 0 && x.ending === null && !x.dying;
    if (stranded(s) && stranded(samples[i + 1])) {
      findings.push(finding('structural', HIGH, s, 'lives reached zero without the run ending'));
    }
  }
  return findings;
}

export function checkPageErrors(errors = []) {
  return errors.map((e) => ({
    kind: 'pageError',
    severity: CRITICAL,
    stepIndex: 0,
    x: null,
    evidence: `${e.kind}: ${e.text}`
  }));
}

/**
 * Did the run finish inside its budget?
 *
 * Reported as HIGH rather than CRITICAL: a policy like `idler` is never
 * supposed to finish, and the pilot's boss fights are long. The useful signal
 * is the furthest x reached, which says where it got stuck.
 */
export function checkCompletion(samples, options = {}) {
  const last = samples[samples.length - 1];
  if (!last || last.ending !== null) {
    return [];
  }
  if (options.expectCompletion === false) {
    return [];
  }
  return [
    finding(
      'notCompletable',
      HIGH,
      last,
      `run hit its ${options.budget ?? 0}-step budget without ending; furthest x=${Math.round(last.maxPlayerX ?? 0)}`
    )
  ];
}

/**
 * Collapse repeats within one run.
 *
 * A wedged run re-reports the same stall every window until the budget runs
 * out - 28 identical findings from one idle run in the first trial. One finding
 * per (kind, bucket) with a count keeps the signal and drops the noise.
 */
export function dedupeFindings(findings) {
  const byKey = new Map();
  for (const f of findings) {
    const key = `${f.kind}:${f.bucket ?? f.x ?? ''}`;
    const seen = byKey.get(key);
    if (seen) {
      seen.occurrences += 1;
    } else {
      byKey.set(key, { ...f, occurrences: 1 });
    }
  }
  return [...byKey.values()];
}

/**
 * Archetypes that are designed NOT to threaten the player directly.
 *
 * Enemy body contact is deliberately harmless in this game - only projectiles
 * and the boss shockwave damage - so an archetype listed here is expected never
 * to appear in `damageByKind`, and its absence is not a finding. Recording that
 * explicitly is the point: a silent pass and a documented exemption look the
 * same until someone breaks one of them.
 */
export const HARMLESS_ARCHETYPES = new Set();

/**
 * Boss-active samples a (boss, weapon) pair needs before it is judged.
 *
 * A run where the player meets the boss and dies immediately proves nothing
 * about that weapon; ten simulated seconds of exposure does.
 */
export const BOSS_WEAPON_MIN_SAMPLES = 20;

/**
 * Coverage: does combat actually work?
 *
 * Every other invariant here watches the PLAYER - stuck, dead, out of bounds,
 * counters moving the wrong way. None of them notice when an actor stops
 * functioning, because a broken enemy just makes the game easier and a boss
 * that cannot be hurt reads as difficulty. That gap is exactly how the Reactor
 * Warden shipped with the Siege Walker's hitbox, immune to level fire, with the
 * whole suite green (TASK-028).
 *
 * Judged over the WHOLE matrix, not per run: one run has no business meeting
 * every archetype, and an archetype that never appeared anywhere is not a
 * failure - it is simply untested, and saying so is more honest than inventing
 * a pass.
 */
export function checkCoverage(traces) {
  const seenArchetypes = new Set();
  const killed = new Set();
  const damaged = new Set();
  const bossesSeen = new Map(); // bossId -> best damage taken across the matrix
  const bossWeapon = new Map(); // `bossId|weapon` -> { samples, damage }

  for (const trace of traces) {
    for (const sample of trace.samples ?? []) {
      for (const kind of sample.enemyKinds ?? []) {
        seenArchetypes.add(kind);
      }
      for (const [kind, n] of Object.entries(sample.killsByKind ?? {})) {
        if (n > 0) {
          killed.add(kind);
          seenArchetypes.add(kind);
        }
      }
      for (const [kind, n] of Object.entries(sample.damageByKind ?? {})) {
        if (n > 0) {
          damaged.add(kind);
        }
      }
      if (sample.bossId) {
        const best = Math.max(bossesSeen.get(sample.bossId) ?? 0, sample.bossDamageTaken ?? 0);
        bossesSeen.set(sample.bossId, best);
        if (sample.bossActive && sample.weapon) {
          const key = `${sample.bossId}|${sample.weapon}`;
          const stat = bossWeapon.get(key) ?? { samples: 0, damage: 0 };
          stat.samples += 1;
          stat.damage = Math.max(stat.damage, sample.bossDamageTaken ?? 0);
          bossWeapon.set(key, stat);
        }
      }
    }
  }

  const findings = [];
  const note = (kind, evidence) => ({ kind, severity: CRITICAL, stepIndex: 0, x: null, evidence });

  for (const [bossId, damage] of bossesSeen) {
    if (damage <= 0) {
      findings.push(
        note(
          'coverageBossUndamageable',
          `boss "${bossId}" appeared across the matrix but never took a single point of damage - ` +
            `either nothing can reach it or its hitbox is wrong`
        )
      );
    }
  }

  // Per weapon, not just overall. "Damageable by SOMETHING" is too weak a
  // question: the Reactor Warden shipped hittable only by the scatter fan,
  // whose pellets rise into a hitbox that was 16 px too short, while the two
  // single-bolt weapons passed straight under it. Asking it of every weapon is
  // what turns that from "the pilot lost" into a named defect.
  for (const [key, stat] of bossWeapon) {
    if (stat.samples >= BOSS_WEAPON_MIN_SAMPLES && stat.damage <= 0) {
      const [bossId, weapon] = key.split('|');
      findings.push(
        note(
          'coverageBossWeaponIneffective',
          `boss "${bossId}" never took damage from the "${weapon}" weapon across ` +
            `${stat.samples} samples of active fight - that weapon cannot hurt it`
        )
      );
    }
  }

  for (const kind of seenArchetypes) {
    if (!killed.has(kind)) {
      findings.push(
        note('coverageEnemyUnkillable', `enemy "${kind}" appeared but was never killed anywhere in the matrix`)
      );
    }
    if (!damaged.has(kind) && !HARMLESS_ARCHETYPES.has(kind)) {
      findings.push(
        note(
          'coverageEnemyHarmless',
          `enemy "${kind}" appeared but never damaged the player anywhere in the matrix - ` +
            `either its attack is broken or it belongs in HARMLESS_ARCHETYPES`
        )
      );
    }
  }

  return findings;
}

/** Run every detector over one trace. */
export function evaluateRun(trace) {
  const {
    samples = [],
    errors = [],
    levelWidth = 3240,
    budget = 0,
    expectCompletion = true,
    expectsProgress = true,
    policy = null
  } = trace;
  const last = samples[samples.length - 1];

  const findings = [
    ...checkPageErrors(errors),
    ...checkBounds(samples, levelWidth),
    // A policy that never tries to move cannot meaningfully "stall".
    ...(expectsProgress ? detectStall(samples) : []),
    ...detectDeathTrap(last?.deathLog ?? []),
    ...checkMonotonic(samples),
    ...checkResources(samples),
    ...checkStructural(samples),
    ...checkCompletion(samples, { budget, expectCompletion })
  ];

  // Tag with the policy so aggregation can weight a pilot finding (a competent
  // player hit this) above a chaos-policy one (a deliberately bad player did).
  return dedupeFindings(findings).map((f) => (policy ? { ...f, policy } : f));
}
