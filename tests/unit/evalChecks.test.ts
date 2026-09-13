import { describe, expect, test } from 'vitest';

import {
  bucketX,
  checkBounds,
  checkMonotonic,
  checkResources,
  checkStructural,
  dedupeFindings,
  detectDeathTrap,
  detectStall,
  progressed,
  stallSuppressed,
  BOSS_STALL_STEPS,
  TRAVERSAL_STALL_STEPS
} from '../../scripts/eval/checks.mjs';

/**
 * The detectors are only worth having if they stay quiet during the states
 * where the game is legitimately standing still. Each of those cases is pinned
 * here, because a detector that cries wolf gets muted and then finds nothing.
 */

const SAMPLE_STEPS = 30;

interface Sample {
  stepIndex: number;
  playerX: number;
  maxPlayerX: number;
  lives: number;
  score: number;
  checkpoint: string | null;
  deaths: number;
  bossActive: boolean;
  bossHealth: number;
  bossPhase: number;
  subcomponentsAlive: number;
  containersAlive: number;
  dying: boolean;
  completing: boolean;
  paused: boolean;
  autoPaused: boolean;
  ending: string | null;
  [key: string]: unknown;
}

function sample(overrides: Partial<Sample> = {}): Sample {
  return {
    stepIndex: 0,
    playerX: 100,
    maxPlayerX: 100,
    lives: 3,
    score: 0,
    checkpoint: 'start',
    deaths: 0,
    bossActive: false,
    bossHealth: 0,
    bossPhase: 0,
    subcomponentsAlive: 0,
    containersAlive: 2,
    dying: false,
    completing: false,
    paused: false,
    autoPaused: false,
    ending: null,
    ...overrides
  };
}

/** Build `count` samples `SAMPLE_STEPS` apart, mutated by `shape`. */
function series(count: number, shape: (i: number) => Partial<Sample>): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < count; i++) {
    out.push(sample({ stepIndex: i * SAMPLE_STEPS, ...shape(i) }));
  }
  return out;
}

describe('progressed', () => {
  test('only counts monotone signals, not raw x jitter', () => {
    const a = sample({ playerX: 100, maxPlayerX: 100 });
    // Wedged against a door: x wobbles but the furthest point never advances.
    const b = sample({ playerX: 103, maxPlayerX: 100 });
    expect(progressed(a, b)).toBe(false);

    expect(progressed(a, sample({ maxPlayerX: 101 }))).toBe(true);
    expect(progressed(a, sample({ lives: 2 }))).toBe(true);
    expect(progressed(a, sample({ score: 50 }))).toBe(true);
    expect(progressed(a, sample({ deaths: 1 }))).toBe(true);
    expect(progressed(a, sample({ containersAlive: 1 }))).toBe(true);
    expect(progressed(a, sample({ completing: true }))).toBe(true);
    expect(progressed(a, sample({ ending: 'results' }))).toBe(true);
  });

  test('boss damage counts as progress even though x cannot grow', () => {
    const a = sample({ bossActive: true, bossHealth: 12 });
    expect(progressed(a, sample({ bossActive: true, bossHealth: 10 }))).toBe(true);
    expect(progressed(a, sample({ bossActive: true, bossHealth: 12, bossPhase: 1 }))).toBe(true);
    expect(progressed(a, sample({ bossActive: true, bossHealth: 12, subcomponentsAlive: -1 }))).toBe(true);
  });
});

describe('stallSuppressed', () => {
  test('covers the states where standing still is correct', () => {
    expect(stallSuppressed(sample({ dying: true }))).toBe(true);
    expect(stallSuppressed(sample({ completing: true }))).toBe(true);
    expect(stallSuppressed(sample({ paused: true }))).toBe(true);
    expect(stallSuppressed(sample({ autoPaused: true }))).toBe(true);
    expect(stallSuppressed(sample({ ending: 'gameOver' }))).toBe(true);
    expect(stallSuppressed(sample())).toBe(false);
  });

  test('invulnerability is NOT suppressed: it is long and the player can still move', () => {
    expect(stallSuppressed(sample({ invuln: true }))).toBe(false);
  });
});

describe('detectStall false positives', () => {
  test('waiting out the 4 s moving platform is not a stall', () => {
    // l2-mp-vert runs 320..420 at 50 px/s: 2 s each way, 4 s round trip = 240
    // steps. The 600-step window is deliberately 2.5x that.
    const samples = series(9, () => ({ playerX: 700, maxPlayerX: 700 }));
    expect(detectStall(samples)).toEqual([]);
  });

  test('the death pause and respawn are not a stall', () => {
    const samples = series(40, (i) => ({
      playerX: 500,
      maxPlayerX: 500,
      dying: i > 2
    }));
    expect(detectStall(samples)).toEqual([]);
  });

  test('the completion delay is not a stall', () => {
    const samples = series(40, (i) => ({
      playerX: 3180,
      maxPlayerX: 3180,
      completing: i > 2
    }));
    expect(detectStall(samples)).toEqual([]);
  });

  test('holding position between boss cycles is not a stall', () => {
    // The pilot deliberately stands off ~350px from the boss between attacks,
    // oscillating, for far longer than the traversal window.
    const samples = series(60, (i) => ({
      playerX: 2500 + (i % 2) * 6,
      maxPlayerX: 2600,
      bossActive: true,
      bossHealth: 12
    }));
    expect(detectStall(samples)).toEqual([]);
  });

  test('a paused run does not accrue stall time', () => {
    const samples = series(60, (i) => ({ playerX: 400, maxPlayerX: 400, paused: i > 1 }));
    expect(detectStall(samples)).toEqual([]);
  });
});

describe('detectStall true positives', () => {
  test('a wedged run is reported once per window with its position', () => {
    // Pushing into geometry that will not let go: x never advances, nothing is
    // suppressed. This is the Level 2 door signature.
    const samples = series(30, () => ({ playerX: 1778, maxPlayerX: 1778 }));
    const findings = detectStall(samples);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].kind).toBe('stall');
    expect(findings[0].severity).toBe('CRITICAL');
    expect(findings[0].x).toBe(1778);
    expect(findings[0].bucket).toBe(bucketX(1778));
    expect(findings[0].stalledSteps).toBeGreaterThan(TRAVERSAL_STALL_STEPS);
  });

  test('an unkillable boss is reported against the longer boss window', () => {
    const shortFight = series(60, () => ({
      playerX: 2600,
      maxPlayerX: 2600,
      bossActive: true,
      bossHealth: 12
    }));
    // A minute is not yet suspicious for a boss fight.
    expect(detectStall(shortFight)).toEqual([]);

    const endlessFight = series(200, () => ({
      playerX: 2600,
      maxPlayerX: 2600,
      bossActive: true,
      bossHealth: 12
    }));
    const findings = detectStall(endlessFight);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].kind).toBe('bossStall');
    expect(findings[0].stalledSteps).toBeGreaterThan(BOSS_STALL_STEPS);
  });

  test('suppressed samples freeze the clock rather than resetting it', () => {
    // A run that pauses briefly in the middle of a long wedge is still wedged;
    // freezing (not resetting) means the pause cannot hide it forever.
    const samples = series(40, (i) => ({
      playerX: 900,
      maxPlayerX: 900,
      paused: i === 20
    }));
    expect(detectStall(samples).length).toBeGreaterThan(0);
  });
});

describe('detectDeathTrap', () => {
  test('repeated deaths in one place are a trap', () => {
    const deaths = [
      { cause: 'enemyFire', x: 2583, y: 480, stepIndex: 1596, costLife: true },
      { cause: 'enemyFire', x: 2583, y: 480, stepIndex: 1933, costLife: true },
      { cause: 'enemyFire', x: 2586, y: 480, stepIndex: 2270, costLife: true }
    ];
    const findings = detectDeathTrap(deaths);
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe('deathTrap');
    expect(findings[0].severity).toBe('CRITICAL');
    expect(findings[0].evidence).toContain('3 deaths');
  });

  test('deaths spread across the level are just a hard game', () => {
    const deaths = [
      { cause: 'enemyFire', x: 672, y: 480, stepIndex: 171, costLife: true },
      { cause: 'enemyFire', x: 1185, y: 480, stepIndex: 348, costLife: true },
      { cause: 'enemyFire', x: 1881, y: 480, stepIndex: 542, costLife: true },
      { cause: 'enemyFire', x: 2529, y: 480, stepIndex: 1040, costLife: true }
    ];
    expect(detectDeathTrap(deaths)).toEqual([]);
  });

  test('a death that cost no life is reported on its own', () => {
    const deaths = [{ cause: 'pit', x: 770, y: 600, stepIndex: 252, costLife: false }];
    const findings = detectDeathTrap(deaths);
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe('freeDeath');
    expect(findings[0].evidence).toContain('cost no life');
  });

  test('no deaths, no findings', () => {
    expect(detectDeathTrap([])).toEqual([]);
  });
});

describe('value checks', () => {
  test('non-finite numbers and out-of-bounds positions are critical', () => {
    expect(checkBounds([sample({ playerX: NaN })], 3240)[0].kind).toBe('nanField');
    expect(checkBounds([sample({ playerX: -400 })], 3240)[0].kind).toBe('outOfBounds');
    expect(checkBounds([sample({ playerX: 9999 })], 3240)[0].kind).toBe('outOfBounds');
    expect(checkBounds([sample({ playerX: 3200 })], 3240)).toEqual([]);
  });

  test('lives may not rise and score may not fall', () => {
    expect(checkMonotonic([sample({ lives: 2 }), sample({ lives: 3 })])[0].evidence).toContain('lives rose');
    expect(checkMonotonic([sample({ score: 100 }), sample({ score: 50 })])[0].evidence).toContain('score fell');
    expect(checkMonotonic([sample({ lives: 3 }), sample({ lives: 2 })])).toEqual([]);
  });

  test('boss health may not rise while the boss is active', () => {
    const findings = checkMonotonic([
      sample({ bossActive: true, bossHealth: 8 }),
      sample({ bossActive: true, bossHealth: 12 })
    ]);
    expect(findings[0].evidence).toContain('boss health rose');
  });

  test('resource caps report only the worst offender', () => {
    const findings = checkResources([sample({ maxEnemiesSeen: 20 }), sample({ maxEnemiesSeen: 40 })]);
    expect(findings).toHaveLength(1);
    expect(findings[0].evidence).toContain('40');
  });

  test('structural contradictions between fields are caught', () => {
    expect(checkStructural([sample({ bossX: 2800, bossActive: false })])[0].evidence).toContain('bossX');
    expect(checkStructural([sample({ bossVulnerable: true, bossActive: false })])[0].evidence).toContain('vulnerable');
    expect(checkStructural([sample({ lives: 0 })])[0].evidence).toContain('lives reached zero');
    expect(checkStructural([sample({ lives: 0, ending: 'gameOver' })])).toEqual([]);
  });
});

describe('dedupeFindings', () => {
  test('repeats of the same finding collapse into one with a count', () => {
    const findings = [
      { kind: 'stall', bucket: 1728, x: 1778, severity: 'CRITICAL', stepIndex: 600, evidence: 'a' },
      { kind: 'stall', bucket: 1728, x: 1780, severity: 'CRITICAL', stepIndex: 1200, evidence: 'b' },
      { kind: 'stall', bucket: 2560, x: 2600, severity: 'CRITICAL', stepIndex: 1800, evidence: 'c' }
    ];
    const deduped = dedupeFindings(findings);
    expect(deduped).toHaveLength(2);
    expect(deduped[0].occurrences).toBe(2);
    expect(deduped[1].occurrences).toBe(1);
  });
});
