/**
 * One configured self-play run: drive it, sample it, check it, write it out.
 *
 *   node scripts/eval/run.mjs --level 1 --checkpoint start --lives 3 --policy pilot
 *
 * Everything the player does goes through the normal input merge, so a run is
 * beatable the honest way; the only debug commands used are the ones that set
 * the run up (`startLevel*`, `startAtCheckpoint`) and the clock (`advanceSteps`).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { closeSession, launch, log, openGame, DEFAULT_BASE } from '../lib/browser.mjs';
import { act, command, getState, settleSceneSwap, waitForScene } from '../lib/bridge.mjs';
import { createPolicy, SAMPLE_STEPS } from '../lib/policies.mjs';
import { evaluateRun } from './checks.mjs';

/** Both levels are 3240 wide; the runtime does not publish level extents. */
export const LEVEL_WIDTH = 3240;

/** 5 simulated minutes. Generous: the pilot's boss fights are genuinely long. */
export const RUN_BUDGET_STEPS = 18_000;

export const OUT_DIR = join('test-results', 'eval');

/** Project a runtime snapshot down to what the detectors actually read. */
export function projectSample(state) {
  const r = state?.runtime ?? {};
  return {
    scene: state?.scene ?? null,
    stepIndex: r.stepIndex ?? 0,
    playerX: r.playerX ?? 0,
    playerY: r.playerY ?? 0,
    maxPlayerX: r.maxPlayerX ?? 0,
    grounded: Boolean(r.grounded),
    lives: r.lives ?? 0,
    score: r.score ?? 0,
    weapon: r.weapon ?? null,
    checkpoint: r.checkpoint ?? null,
    deaths: Array.isArray(r.deaths) ? r.deaths.length : 0,
    bossActive: Boolean(r.bossActive),
    bossHealth: r.bossHealth ?? 0,
    bossPhase: r.bossPhase ?? 0,
    bossVulnerable: Boolean(r.bossVulnerable),
    bossX: r.bossX ?? null,
    subcomponentsAlive: r.subcomponentsAlive ?? 0,
    containersAlive: r.containersAlive ?? 0,
    enemyCount: r.enemyCount ?? 0,
    // Coverage inputs: which archetypes were present, what died, what hurt us.
    enemyKinds: [...new Set((r.enemies ?? []).map((e) => e.kind))],
    killsByKind: r.killsByKind ?? {},
    damageByKind: r.damageByKind ?? {},
    bossId: r.bossId ?? null,
    bossDamageTaken: r.bossDamageTaken ?? 0,
    projectileCount: r.projectileCount ?? 0,
    enemyProjectileCount: r.enemyProjectileCount ?? 0,
    maxEnemiesSeen: r.maxEnemiesSeen ?? 0,
    maxPlayerBulletsSeen: r.maxPlayerBulletsSeen ?? 0,
    maxEnemyBulletsSeen: r.maxEnemyBulletsSeen ?? 0,
    particleCount: r.particleCount ?? 0,
    dying: Boolean(r.dying),
    completing: Boolean(r.completing),
    paused: Boolean(r.paused),
    autoPaused: Boolean(r.autoPaused),
    ending: r.ending ?? null
  };
}

export function runId(config) {
  const parts = [`L${config.level}`, config.checkpoint, `${config.lives}lives`, config.policy];
  if (config.weapon) {
    parts.push(config.weapon);
  }
  if (config.seed !== undefined) {
    parts.push(`seed${config.seed}`);
  }
  if (config.sampleSteps && config.sampleSteps !== SAMPLE_STEPS) {
    parts.push(`chunk${config.sampleSteps}`);
  }
  if (config.chain) {
    parts.push(`chain${config.chainLeg ?? ''}`);
  }
  return parts.join('-');
}

/**
 * Drive one run to its end or its budget.
 *
 * `page` is already on the game with the bridge up. Returns the trace; the
 * caller decides what to do with it.
 */
export async function driveRun(page, config, errors) {
  const policy = config.policyInstance ?? createPolicy(config.policy);
  const budget = config.budget ?? RUN_BUDGET_STEPS;
  const sampleSteps = config.sampleSteps ?? SAMPLE_STEPS;

  if (config.setup !== 'natural') {
    if (!policy.autopilot || config.level !== 1) {
      // Built from the level number: a two-way choice sent every level past 2
      // to level 1 and reported it under the wrong name.
      await command(page, `startLevel${config.level}`);
    }
    await waitForScene(page, 'level');

    // Always go through startAtCheckpoint: it resets the run, places the
    // player, and - unlike teleportPlayer - leaves every spawn trigger ahead of
    // the checkpoint armed, so the segment plays the way a real player meets it.
    const started = await command(page, 'startAtCheckpoint', {
      id: config.checkpoint,
      lives: config.lives,
      ...(config.weapon ? { weapon: config.weapon } : {})
    });
    if (!started?.ok) {
      throw new Error(`startAtCheckpoint failed: ${JSON.stringify(started)}`);
    }
  }

  const first = await getState(page);
  const samples = [projectSample(first)];
  let deathLog = first?.runtime?.deaths ?? [];
  let steps = 0;
  let ended = null;
  let sample = 0;

  while (steps < budget) {
    const spec = policy.next(samples[samples.length - 1], { sample, steps }) ?? {};
    const chunk = Math.min(sampleSteps, budget - steps);
    const res = await act(page, spec, chunk);
    if (!res) {
      throw new Error('bridge disappeared mid-run');
    }
    steps += res.result?.steps ?? 0;
    samples.push(projectSample(res.state));
    // `act` reads the snapshot synchronously, before any frame can process a
    // queued scene swap, so even the chunk that ends the run still carries the
    // level's final death log. Reading it afterwards would get the game-over
    // snapshot, which has no counters at all.
    if (Array.isArray(res.state?.runtime?.deaths)) {
      deathLog = res.state.runtime.deaths;
    }
    sample += 1;
    if (res.result?.ended) {
      ended = res.result.ended;
      break;
    }
  }

  // Only the final sample carries the full log; repeating it on every sample
  // would bloat the trace for no gain.
  samples[samples.length - 1].deathLog = deathLog;

  if (ended) {
    await settleSceneSwap(page);
  }

  return {
    config,
    ended,
    steps,
    samples,
    errors,
    levelWidth: LEVEL_WIDTH,
    budget,
    policy: policy.name,
    expectsProgress: policy.expectsProgress !== false,
    expectCompletion: config.expectCompletion ?? policy.autopilot
  };
}

/**
 * Run one config on an already-open browser.
 *
 * The matrix reuses one browser across every run - launching Chromium costs
 * roughly a second, opening a context costs tens of milliseconds - but takes a
 * FRESH CONTEXT per run, because localStorage (settings, best score) and the
 * Phaser registry (`autopilot`, `currentLevelIndex`, `lastScore`) both survive
 * a plain re-navigation and would leak state from one run into the next.
 */
export async function runOnBrowser(browser, config) {
  const policy = config.policyInstance ?? createPolicy(config.policy);
  let session;
  try {
    session = await openGame(browser, {
      base: config.base ?? DEFAULT_BASE,
      manualClock: true,
      autopilot: policy.autopilot ? '1' : null,
      settings: { startingLives: config.lives }
    });
    const traces = config.chain
      ? await driveChain(session.page, { ...config, policyInstance: policy }, session.errors)
      : [await driveRun(session.page, { ...config, policyInstance: policy }, session.errors)];
    for (const trace of traces) {
      trace.findings = evaluateRun(trace);
    }
    return traces;
  } finally {
    await closeSession(session);
  }
}

/**
 * Play the whole game as one session: Level 1 -> results -> Level 2 -> ending.
 *
 * Each level is kept as its own trace, because `stepIndex` restarts per level
 * and the detectors assume it only ever grows. The point of the chain is the
 * cross-level carry-over - the registry keeping the pilot engaged through the
 * results screen - which is the one thing per-segment runs cannot exercise.
 */
export async function driveChain(page, config, errors) {
  const traces = [];
  for (let leg = 0; leg < 2; leg++) {
    const legConfig = {
      ...config,
      level: leg + 1,
      // Leg 1 sets the run up; leg 2 must inherit whatever the game handed it.
      setup: leg === 0 ? 'checkpoint' : 'natural',
      chainLeg: leg + 1
    };
    const trace = await driveRun(page, legConfig, errors);
    traces.push(trace);
    if (trace.ended !== 'results') {
      break; // died out or hit the budget: the chain stops here
    }
    const state = await waitForScene(page, 'results');
    if (state?.runtime?.final) {
      break; // MISSION COMPLETE
    }
    await command(page, 'confirmMenu');
    await waitForScene(page, 'level');
  }
  return traces;
}

export async function runOne(config) {
  const browser = await launch({ headless: config.headless ?? true });
  try {
    const traces = await runOnBrowser(browser, config);
    return traces[0];
  } finally {
    await browser.close().catch(() => undefined);
  }
}

export function writeTrace(trace) {
  const file = join(OUT_DIR, `run-${runId(trace.config)}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(trace, null, 2), 'utf8');
  return file;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = value;
  }
  return out;
}

const isMain = process.argv[1] && process.argv[1].endsWith('run.mjs');
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const config = {
    level: Number(args.level ?? 1),
    checkpoint: args.checkpoint ?? 'start',
    lives: Number(args.lives ?? 3),
    policy: args.policy ?? 'pilot',
    weapon: args.weapon ?? null,
    base: args.base ?? DEFAULT_BASE,
    headless: args.headed !== 'true',
    budget: args.budget ? Number(args.budget) : RUN_BUDGET_STEPS
  };

  const trace = await runOne(config);
  const file = writeTrace(trace);
  const critical = trace.findings.filter((f) => f.severity === 'CRITICAL');

  log(
    `EVALRUN id=${runId(config)} ended=${trace.ended ?? 'budget'} steps=${trace.steps}` +
      ` samples=${trace.samples.length} findings=${trace.findings.length} critical=${critical.length}`
  );
  for (const f of trace.findings) {
    log(`  [${f.severity}] ${f.kind} @x=${f.x} step=${f.stepIndex}: ${f.evidence}`);
  }
  log(`  trace: ${file}`);

  process.exit(critical.length > 0 ? 1 : 0);
}
